import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint =
  process.env.S3_PUBLIC_URL ||
  process.env.MINIO_PUBLIC_URL ||
  process.env.S3_ENDPOINT ||
  `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`;

const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.MINIO_ACCESS_KEY ||
  'minioadmin';

const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.MINIO_SECRET_KEY ||
  'minioadmin';

export const BUCKET_NAME =
  process.env.S3_BUCKET_NAME ||
  process.env.MINIO_BUCKET ||
  'gem-project';

export const PRIVATE_BUCKET_NAME =
  process.env.S3_PRIVATE_BUCKET_NAME ||
  process.env.MINIO_PRIVATE_BUCKET ||
  'gem-private';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generateDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePrivateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600,
) {
  const command = new PutObjectCommand({
    Bucket: PRIVATE_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generatePrivateDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: PRIVATE_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export { s3Client };