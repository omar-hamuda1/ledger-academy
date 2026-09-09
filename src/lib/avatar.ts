import { objectStore } from "./storage";

/**
 * Short-lived presigned GET URL for a profile photo, or null (initials
 * fallback). The bucket is private, so this rotates ~hourly — render it on a
 * plain <img>, not next/image.
 */
export async function avatarUrl(key: string | null | undefined): Promise<string | null> {
  if (!key || !objectStore) return null;
  try {
    return await objectStore.url(key, { expiresIn: 3600 });
  } catch (error) {
    console.error("avatar presign failed:", error);
    return null;
  }
}
