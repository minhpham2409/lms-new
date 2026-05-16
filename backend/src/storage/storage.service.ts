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
    const accessKey = this.config.get<string>('S3_ACCESS_KEY', 'minioadmin');
    const secretKey = this.config.get<string>('S3_SECRET_KEY', 'minioadmin');
    this.forcePathStyle = this.config.get<string>('S3_FORCE_PATH_STYLE', 'true') === 'true';
    this.bucket = this.config.get<string>('S3_BUCKET', 'lms-assets');
    this.publicEndpoint = this.config.get<string>('S3_PUBLIC_ENDPOINT', endpoint);
    this.signedUrlExpires = parseInt(this.config.get<string>('S3_SIGNED_URL_EXPIRES', '3600'), 10);

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
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
}
