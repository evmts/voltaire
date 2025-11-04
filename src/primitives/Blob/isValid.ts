import type { BrandedBlob } from "./BrandedBlob.js";
import { SIZE } from "./constants.js";

/**
 * Validate blob has correct size
 *
 * @param blob - Blob to validate
 * @returns true if blob is exactly SIZE bytes
 *
 * @example
 * ```typescript
 * if (!Blob.isValid(blob)) {
 *   throw new Error("Invalid blob");
 * }
 * ```
 */
export function isValid(blob: Uint8Array): blob is BrandedBlob {
	return blob.length === SIZE;
}
