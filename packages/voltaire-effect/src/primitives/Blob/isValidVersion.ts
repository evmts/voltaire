/**
 * @module isValidVersion
 * @description Validate versioned hash has correct KZG version byte
 * @since 0.1.0
 */
import { BrandedBlob as BlobNamespace } from "@tevm/voltaire";

type VersionedHash = BlobNamespace.VersionedHash;

/**
 * Validate versioned hash has correct version byte (0x01 for KZG).
 * Pure function - never throws.
 *
 * @param hash - 32-byte versioned hash to validate
 * @returns true if version byte is 0x01 (KZG), false otherwise
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 *
 * if (Blob.isValidVersion(hash)) {
 *   // hash has valid KZG version
 * }
 * ```
 * @since 0.1.0
 */
export const isValidVersion = (hash: VersionedHash): boolean =>
	BlobNamespace.isValidVersion(hash);
