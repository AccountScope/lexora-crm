export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface StorageAdapter {
  upload(objectPath: string, data: Buffer | Uint8Array, options?: UploadOptions): Promise<void>;
  getSignedUrl(objectPath: string, expiresInSeconds: number): Promise<string>;
  delete(objectPath: string): Promise<void>;
}
