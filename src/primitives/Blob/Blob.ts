/**
 * Blob (EIP-4844) Type Definitions
 */

// Re-export types
export type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BrandedBlob.js";

// For backwards compatibility, export BrandedBlob as Data
export type { BrandedBlob as Data } from "./BrandedBlob.js";
