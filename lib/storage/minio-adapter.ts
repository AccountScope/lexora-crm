import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioStorageConfig } from "@/lib/storage/config";
import type { StorageAdapter, UploadOptions } from "@/lib/storage/types";

// Only initialize MinIO if credentials are provided
// This allows builds to succeed when using Supabase storage mode
let s3: S3Client | null = null;

if (minioStorageConfig.accessKey && minioStorageConfig.secretKey) {
  s3 = new S3Client({
    region: "us-east-1",
    endpoint: `${minioStorageConfig.useSSL ? "https" : "http"}://${minioStorageConfig.endPoint}:${minioStorageConfig.port}`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: minioStorageConfig.accessKey!,
      secretAccessKey: minioStorageConfig.secretKey!,
    },
  });
}

const ensureMinIOConfigured = () => {
  if (!s3) {
    throw new Error("MinIO storage requires MINIO_ACCESS_KEY and MINIO_SECRET_KEY");
  }
  return s3;
};

export const minioStorageAdapter: StorageAdapter = {
  async upload(objectPath, data, options) {
    const client = ensureMinIOConfigured();
    const command = new PutObjectCommand({
      Bucket: minioStorageConfig.bucket,
      Key: objectPath,
      Body: data,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl,
    });
    await ensureMinIOConfigured().send(command);
  },
  async delete(objectPath) {
    await ensureMinIOConfigured().send(
      new DeleteObjectCommand({
        Bucket: minioStorageConfig.bucket,
        Key: objectPath,
      })
    );
  },
  async getSignedUrl(objectPath, expiresInSeconds) {
    const client = ensureMinIOConfigured();
    const command = new GetObjectCommand({
      Bucket: minioStorageConfig.bucket,
      Key: objectPath,
    });
    return awsGetSignedUrl(client, command, { expiresIn: expiresInSeconds });
  },
};
