import slugify from 'slugify';
import crypto from 'node:crypto';

/**
 * Generates a URL-friendly slug from a title, appending a short random suffix
 * to ensure uniqueness without a DB round-trip.
 */
export function generateListingSlug(title: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}

/**
 * Generates a short unique idempotency key.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Creates a safe response object stripping sensitive fields.
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}
