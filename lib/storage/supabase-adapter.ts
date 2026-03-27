import { createClient } from "@supabase/supabase-js";
import { storageMode, supabaseStorageConfig } from "@/lib/storage/config";
import type { StorageAdapter, UploadOptions } from "@/lib/storage/types";

if (storageMode === "supabase" && (!supabaseStorageConfig.url || !supabaseStorageConfig.serviceRoleKey)) {
  throw new Error("Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = () =>
  createClient(supabaseStorageConfig.url!, supabaseStorageConfig.serviceRoleKey!, {
    auth: { persistSession: false },
  });

export const supabaseStorageAdapter: StorageAdapter = {
  async upload(objectPath, data, options) {
    const client = supabase();
    const bucket = supabaseStorageConfig.bucket;
    const { error } = await client.storage
      .from(bucket)
      .upload(objectPath, data, {
        cacheControl: options?.cacheControl ?? "86400",
        contentType: options?.contentType,
        upsert: true,
        metadata: options?.metadata,
      });
    if (error) {
      throw error;
    }
  },
  async delete(objectPath) {
    const client = supabase();
    const bucket = supabaseStorageConfig.bucket;
    const { error } = await client.storage.from(bucket).remove([objectPath]);
    if (error) {
      throw error;
    }
  },
  async getSignedUrl(objectPath, expiresInSeconds) {
    const client = supabase();
    const bucket = supabaseStorageConfig.bucket;
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(objectPath, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw error ?? new Error("Failed to sign URL");
    }
    return data.signedUrl;
  },
};
