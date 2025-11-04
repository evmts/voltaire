import type { VersionedHash } from "./BrandedBlob.js";
import { COMMITMENT_VERSION_KZG } from "./constants.js";

/**
 * Validate versioned hash
 *
 * @param hash - Versioned hash
 * @returns true if version byte is correct
 *
 * @example
 * ```typescript
 * if (!Blob.isValidVersion(hash)) {
 *   throw new Error("Invalid version");
 * }
 * ```
 */
export function isValidVersion(hash: VersionedHash): boolean {
	return hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG;
}
