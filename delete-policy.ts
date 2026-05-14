import { S3Client, DeleteBucketPolicyCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  forcePathStyle: true,
  credentials: { 
    accessKeyId: process.env.MINIO_ACCESS_KEY!, 
    secretAccessKey: process.env.MINIO_SECRET_KEY! 
  }
});

client.send(new DeleteBucketPolicyCommand({ Bucket: process.env.MINIO_BUCKET_NAME! }))
  .then(() => console.log('Policy deleted'))
  .catch(console.error);
