import { storageMode } from "@/lib/storage/config";
import { supabaseStorageAdapter } from "@/lib/storage/supabase-adapter";
import { minioStorageAdapter } from "@/lib/storage/minio-adapter";

export const storageAdapter = storageMode === "minio" ? minioStorageAdapter : supabaseStorageAdapter;
