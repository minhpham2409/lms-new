"use client";

import { useState, useCallback, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/** Size of each chunk in bytes (10MB) */
const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_RETRIES = 3;

export interface ChunkedUploadResult {
  jobId: string;
  mediaAssetId: string;
  status: string;
  filename: string;
  originalName: string;
  size: number;
}

export type UploadPhase = "idle" | "initiating" | "uploading" | "merging" | "done" | "error";

export function useChunkedUpload(token: string | null) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setProgress(0);
    setPhase("idle");
    setError(null);
    abortRef.current = false;
  }, []);

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  const upload = useCallback(
    async (file: File): Promise<ChunkedUploadResult | null> => {
      if (!token) {
        setError("Not authenticated");
        setPhase("error");
        return null;
      }

      reset();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      try {
        // Step 1: Initiate upload session
        setPhase("initiating");
        const initRes = await fetch(`${API}/upload/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            totalChunks,
          }),
        });

        if (!initRes.ok) throw new Error("Failed to initiate upload");
        const { uploadId } = await initRes.json();

        // Step 2: Upload chunks sequentially with retry
        setPhase("uploading");
        for (let i = 0; i < totalChunks; i++) {
          if (abortRef.current) {
            setError("Upload cancelled");
            setPhase("error");
            return null;
          }

          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          let success = false;
          for (let retry = 0; retry < MAX_RETRIES; retry++) {
            try {
              const formData = new FormData();
              formData.append("file", chunk, `chunk_${i}`);

              const chunkRes = await fetch(
                `${API}/upload/chunk?uploadId=${uploadId}&chunkIndex=${i}`,
                {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: formData,
                },
              );

              if (chunkRes.ok) {
                success = true;
                break;
              }
            } catch {
              // Retry on network error
              if (retry < MAX_RETRIES - 1) {
                await new Promise((r) => setTimeout(r, 1000 * (retry + 1)));
              }
            }
          }

          if (!success) {
            throw new Error(`Failed to upload chunk ${i} after ${MAX_RETRIES} retries`);
          }

          setProgress(Math.round(((i + 1) / totalChunks) * 100));
        }

        // Step 3: Complete — merge and queue HLS
        setPhase("merging");
        const completeRes = await fetch(`${API}/upload/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            uploadId,
            totalChunks,
            fileName: file.name,
          }),
        });

        if (!completeRes.ok) throw new Error("Failed to complete upload");
        const result: ChunkedUploadResult = await completeRes.json();

        setPhase("done");
        setProgress(100);
        return result;
      } catch (err: any) {
        setError(err.message || "Upload failed");
        setPhase("error");
        return null;
      }
    },
    [token, reset],
  );

  return {
    upload,
    progress,
    phase,
    error,
    reset,
    abort,
  };
}
