import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getContentType } from './storage.constants';
import { Readable } from 'stream';

export interface PutObjectInput {
  key: string;
  body: Buffer | Uint8Array | string | Readable;
  contentType?: string;
  metadata?: Record<string, string>;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client;
  private bucket: string;
  private publicEndpoint: string;
  private forcePathStyle: boolean;
  private signedUrlExpires: number;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const accessKey = this.config.get<string>('S3_ACCESS_KEY');
    const secretKey = this.config.get<string>('S3_SECRET_KEY');
    if (process.env.NODE_ENV === 'production' && (!accessKey || !secretKey)) {
      throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY are required in production');
    }
    this.forcePathStyle = this.config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';
    this.bucket = this.config.get<string>('S3_BUCKET', 'lms-assets');
    this.publicEndpoint = this.config.get<string>('S3_PUBLIC_ENDPOINT', endpoint);
    this.signedUrlExpires = parseInt(this.config.get<string>('S3_SIGNED_URL_EXPIRES', '3600'), 10);

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region,
      credentials: {
        accessKeyId: accessKey || 'dev-minio-access-key',
        secretAccessKey: secretKey || 'dev-minio-secret-key',
      },
      forcePathStyle: this.forcePathStyle,
    };

    // Only set endpoint if provided (MinIO). Omit for real AWS S3.
    if (endpoint) {
      clientConfig.endpoint = endpoint;
    }

    this.client = new S3Client(clientConfig);
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
      this.logger.log(`S3 bucket "${this.bucket}" is ready`);
    } catch (err) {
      this.logger.warn(`Could not verify S3 bucket: ${(err as Error).message}. Storage operations may fail.`);
    }
  }

  /**
   * Create bucket if it does not exist, then set public-read policy.
   */
  private async ensureBucket(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.log(`Creating bucket "${this.bucket}"...`);
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  /**
   * Upload a single object.
   */
  async putObject(input: PutObjectInput): Promise<string> {
    const contentType = input.contentType || getContentType(input.key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: contentType,
        Metadata: input.metadata,
      }),
    );
    return input.key;
  }

  /**
   * Upload multiple objects (e.g. HLS segments).
   */
  async putManyObjects(files: PutObjectInput[]): Promise<string[]> {
    const keys: string[] = [];
    // Upload in batches of 5 to avoid overwhelming the connection
    const batchSize = 5;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const results = await Promise.all(batch.map((f) => this.putObject(f)));
      keys.push(...results);
    }
    return keys;
  }

  /**
   * Delete a single object.
   */
  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * Delete multiple objects. Missing keys are ignored by S3-compatible stores.
   */
  async deleteObjects(keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys)].filter(Boolean);
    const batchSize = 1000;

    for (let i = 0; i < uniqueKeys.length; i += batchSize) {
      const batch = uniqueKeys.slice(i, i + batchSize);
      if (batch.length === 0) continue;

      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );
    }
  }

  /**
   * Delete all objects under a prefix. Used for HLS segment cleanup.
   */
  async deletePrefix(prefix: string): Promise<number> {
    let continuationToken: string | undefined;
    let deleted = 0;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      const keys = (response.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => !!key);

      if (keys.length > 0) {
        await this.deleteObjects(keys);
        deleted += keys.length;
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return deleted;
  }

  /**
   * Check if an object exists.
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return object metadata without downloading the object.
   */
  async getObjectMetadata(key: string) {
    return this.client.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  /**
   * Return a streaming response for the object.
   */
  async getObjectStream(key: string, range?: string): Promise<any> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: range }),
    );
    return response.Body;
  }

  /**
   * Generate a proxy URL for secured media.
   */
  getPublicUrl(key: string): string {
    const baseUrl = this.config.get<string>('API_URL', 'http://localhost:4000/api/v1');
    return `${baseUrl}/media/${key}`;
  }

  /**
   * Generate a time-limited signed URL for private access.
   */
  async getSignedReadUrl(key: string, expiresIn?: number): Promise<string> {
    const ttl = expiresIn ?? this.signedUrlExpires;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: ttl });
  }

  /**
   * Generate a time-limited presigned URL for direct browser-to-S3 uploads.
   * The browser can PUT the file directly to this URL without going through the backend.
   */
  async getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string> {
    const ttl = expiresIn ?? 1800; // 30 minutes default
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: ttl });
  }

  /**
   * Download an S3 object to a local file path.
   * Used by HLS processor to download uploaded videos for ffmpeg conversion.
   */
  async downloadToFile(key: string, destPath: string): Promise<void> {
    const { createWriteStream } = await import('fs');
    const { pipeline } = await import('stream/promises');

    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!response.Body) {
      throw new Error(`S3 object ${key} has no body`);
    }

    const writeStream = createWriteStream(destPath);
    await pipeline(response.Body as Readable, writeStream);
  }

  // ─── S3 Multipart Upload ────────────────────────────────────────────────────
  // Enables chunked uploads: browser sends 10-25MB parts directly to S3,
  // then backend tells S3 to merge them. Supports retry per-part.

  /**
   * Initialize a multipart upload on S3.
   * Returns an uploadId that must be used for all subsequent part uploads.
   */
  async createMultipartUpload(key: string, contentType: string): Promise<string> {
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
    );
    if (!response.UploadId) {
      throw new Error('Failed to create multipart upload — no UploadId returned');
    }
    return response.UploadId;
  }

  /**
   * Generate a presigned URL for uploading a single part.
   * Browser PUTs the chunk directly to this URL.
   */
  async getSignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn = 1800,
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Complete a multipart upload — S3 merges all parts into a single object.
   * Parts must be provided in order with their ETag (returned by S3 after each PUT).
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[],
  ): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );
  }

  /**
   * Abort a multipart upload — S3 deletes all uploaded parts.
   * Call this if upload fails or user cancels.
   */
  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    try {
      await this.client.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: uploadId,
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to abort multipart upload ${uploadId}: ${(error as Error).message}`);
    }
  }
}
