/**
 * Storage Adapter Interface
 * Allows storing artifacts in different backends (DB, S3, local filesystem, CDN)
 */
export interface IStorageAdapter {
  name: string;

  /**
   * Store content and return a URL or identifier
   */
  store(key: string, content: string, metadata?: StorageMetadata): Promise<string>;

  /**
   * Retrieve content by key
   */
  retrieve(key: string): Promise<string>;

  /**
   * Delete content by key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if content exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get public URL for content (if applicable)
   */
  getPublicUrl(key: string): Promise<string | null>;
}

export interface StorageMetadata {
  contentType?: string;
  tags?: Record<string, string>;
  expiresAt?: Date;
  isPublic?: boolean;
}
