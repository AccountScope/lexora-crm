import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioStorageConfig } from "@/lib/storage/config";
import type { StorageAdapter, UploadOptions } from "@/lib/storage/types";

if (!minioStorageConfig.accessKey || !minioStorageConfig.secretKey) {
  throw new Error("MinIO storage requires MINIO_ACCESS_KEY and MINIO_SECRET_KEY");
}

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: `${minioStorageConfig.useSSL ? "https" : "http"}://${minioStorageConfig.endPoint}:${minioStorageConfig.port}`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: minioStorageConfig.accessKey!,
    secretAccessKey: minioStorageConfig.secretKey!,
  },
});

export const minioStorageAdapter: StorageAdapter = {
  async upload(objectPath, data, options) {
    const command = new PutObjectCommand({
      Bucket: minioStorageConfig.bucket,
      Key: objectPath,
      Body: data,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      CacheControl: options?.cacheControl,
    });
    await s3.send(command);
  },
  async delete(objectPath) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: minioStorageConfig.bucket,
        Key: objectPath,
      })
    );
  },
  async getSignedUrl(objectPath, expiresInSeconds) {
    const command = new GetObjectCommand({
      Bucket: minioStorageConfig.bucket,
      Key: objectPath,
    });
    return awsGetSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  },
};
