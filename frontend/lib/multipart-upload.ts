/**
 * S3 Multipart Upload helper.
 * Splits large video into 10MB chunks, uploads each directly to S3,
 * supports per-chunk retry (3 attempts) and progress tracking.
 */

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const MAX_RETRIES = 3;

export interface MultipartProgress {
  phase: "uploading" | "processing";
  progress: number; // 0-100
  currentPart: number;
  totalParts: number;
}

export interface MultipartResult {
  url: string;
  mediaAssetId: string;
}

interface InitResponse {
  uploadId: string;
  s3Key: string;
  mediaAssetId: string;
  chunkSize: number;
  totalParts: number;
}

/**
 * Upload a video file using S3 multipart upload.
 * Each chunk goes directly from browser to S3 — VPS only handles small JSON.
 */
export async function multipartUpload(
  file: File,
  token: string,
  onProgress: (p: MultipartProgress) => void,
  signal?: AbortSignal,
): Promise<MultipartResult> {
  // Step 1: Init multipart upload
  const initRes = await fetch(`${API}/upload/multipart/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
    signal,
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.message || "Không thể khởi tạo upload");
  }
  const init: InitResponse = await initRes.json();
  const { uploadId, s3Key, mediaAssetId, chunkSize, totalParts } = init;

  const completedParts: { PartNumber: number; ETag: string }[] = [];

  try {
    // Step 2: Upload each chunk
    for (let partNum = 1; partNum <= totalParts; partNum++) {
      if (signal?.aborted) throw new Error("Upload cancelled");

      const start = (partNum - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Get presigned URL for this part
      const presignRes = await fetch(`${API}/upload/multipart/presign-part`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ s3Key, uploadId, partNumber: partNum, mediaAssetId }),
        signal,
      });
      if (!presignRes.ok) throw new Error(`Lỗi lấy URL cho phần ${partNum}`);
      const { presignedUrl } = await presignRes.json();

      // Upload chunk to S3 with retry
      let etag: string | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          etag = await uploadChunk(presignedUrl, chunk, file.type, partNum, totalParts, onProgress, signal);
          break;
        } catch (err) {
          if (attempt === MAX_RETRIES || signal?.aborted) throw err;
          // Wait before retry: 1s, 2s, 3s
          await new Promise(r => setTimeout(r, attempt * 1000));
        }
      }

      if (!etag) throw new Error(`Upload phần ${partNum} thất bại sau ${MAX_RETRIES} lần thử`);
      completedParts.push({ PartNumber: partNum, ETag: etag });

      onProgress({
        phase: "uploading",
        progress: Math.round((partNum / totalParts) * 100),
        currentPart: partNum,
        totalParts,
      });
    }

    // Step 3: Complete — tell S3 to merge & trigger HLS
    onProgress({ phase: "processing", progress: 0, currentPart: totalParts, totalParts });

    const completeRes = await fetch(`${API}/upload/multipart/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ s3Key, uploadId, mediaAssetId, parts: completedParts }),
      signal,
    });
    if (!completeRes.ok) throw new Error("Lỗi ghép video trên S3");
    const { jobId } = await completeRes.json();

    // Step 4: Poll HLS conversion progress
    const url = await pollJobStatus(jobId, token, onProgress, signal);
    if (!url) throw new Error("Xử lý HLS thất bại");

    return { url, mediaAssetId };
  } catch (error) {
    // Cleanup: abort multipart upload on S3
    await fetch(`${API}/upload/multipart/abort`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ s3Key, uploadId, mediaAssetId }),
    }).catch(() => {});
    throw error;
  }
}

/** Upload a single chunk to S3 via presigned URL, return ETag */
function uploadChunk(
  url: string, chunk: Blob, contentType: string,
  partNum: number, totalParts: number,
  onProgress: (p: MultipartProgress) => void,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const chunkProgress = e.loaded / e.total;
        const overall = ((partNum - 1 + chunkProgress) / totalParts) * 100;
        onProgress({
          phase: "uploading",
          progress: Math.round(overall),
          currentPart: partNum,
          totalParts,
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (etag) resolve(etag);
        else reject(new Error("S3 không trả về ETag"));
      } else {
        reject(new Error(`Upload phần ${partNum} thất bại: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(chunk);
  });
}

/** Poll HLS job status until complete or failed */
async function pollJobStatus(
  jobId: string, token: string,
  onProgress: (p: MultipartProgress) => void,
  signal?: AbortSignal,
): Promise<string | null> {
  for (let i = 0; i < 600; i++) {
    if (signal?.aborted) return null;
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(`${API}/upload/video/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    }).catch(() => null);
    if (!res?.ok) continue;

    const data = await res.json();
    if (typeof data.progress === "number") {
      onProgress({ phase: "processing", progress: data.progress, currentPart: 0, totalParts: 0 });
    }
    if (data.status === "completed" && data.url) return data.url;
    if (data.status === "failed") return null;
  }
  return null;
}
