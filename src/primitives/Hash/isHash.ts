import type { BrandedHash } from "./BrandedHash.js";
import { SIZE } from "./BrandedHash.js";

/**
 * Check if value is a valid Hash
 *
 * @param value - Value to check
 * @returns True if value is Hash type
 *
 * @example
 * ```typescript
 * if (Hash.isHash(value)) {
 *   // value is Hash
 * }
 * ```
 */
export function isHash(value: unknown): value is BrandedHash {
	return value instanceof Uint8Array && value.length === SIZE;
}
