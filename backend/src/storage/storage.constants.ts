/**
 * Content-Type mappings for S3/MinIO uploads.
 * Used by StorageService to set correct headers.
 */
export const CONTENT_TYPE_MAP: Record<string, string> = {
  // HLS
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'video/iso.segment',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',

  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
};

export function getContentType(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
}
