export type StorageMode = "supabase" | "minio";

const parseMode = (): StorageMode => {
  const raw = (process.env.LEXORA_STORAGE_MODE ?? "supabase").toLowerCase();
  return raw === "minio" ? "minio" : "supabase";
};

export const storageMode = parseMode();

export const supabaseStorageConfig = {
  url: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "lexora-documents",
};

export const minioStorageConfig = {
  endPoint: process.env.MINIO_ENDPOINT ?? "127.0.0.1",
  port: Number(process.env.MINIO_PORT ?? 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  bucket: process.env.MINIO_BUCKET ?? "lexora-documents",
  publicUrl: process.env.MINIO_PUBLIC_URL,
};

export const getStorageBucket = () =>
  storageMode === "minio" ? minioStorageConfig.bucket : supabaseStorageConfig.bucket;
