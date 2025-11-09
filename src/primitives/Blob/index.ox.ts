/**
 * Blob Module - Ox-based Implementation
 *
 * This module provides blob manipulation utilities for EIP-4844 blob transactions.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 *
 * NOTE: Naming difference - Ox uses "Blobs" (plural) while Voltaire uses "Blob" (singular).
 * This implementation exports Ox's Blobs as Blob for backward compatibility.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// NOTE: Ox module is called "Blobs" (plural), we alias to "Blob" (singular)
// ============================================================================

export {
	// Constructors
	from,
	// Converters
	to,
	toHex,
	toBytes,
	// Commitments
	toCommitments,
	toProofs,
	commitmentToVersionedHash,
	commitmentsToVersionedHashes,
	// Sidecars
	toSidecars,
	sidecarsToVersionedHashes,
	// Versioned Hashes
	toVersionedHashes,
	// Types
	type Blob,
	type Blobs,
	type BlobSidecar,
	type BlobSidecars,
	// Constants
	bytesPerFieldElement,
	fieldElementsPerBlob,
	bytesPerBlob,
	maxBytesPerTransaction,
	// Error types
	BlobSizeTooLargeError,
	EmptyBlobError,
	EmptyBlobVersionedHashesError,
	InvalidVersionedHashSizeError,
	InvalidVersionedHashVersionError,
} from "ox/Blobs";

// ============================================================================
// Compatibility Aliases (Voltaire → Ox naming conventions)
// ============================================================================

/**
 * Alias for Ox's commitmentsToVersionedHashes function
 * Voltaire historically used toVersionedHashes for single operation
 * Ox separates toVersionedHashes and commitmentsToVersionedHashes
 */
export { commitmentsToVersionedHashes as toVersionedHashesFromCommitments } from "ox/Blobs";

// ============================================================================
// Re-export with namespace for compatibility
// ============================================================================

// Note: All exports are already provided by the main export block above.
// The namespace export allows destructuring like: import { Blob } from './index.ox'
// and using Blob.from(), Blob.toHex(), etc.

// ============================================================================
// Voltaire Extensions & Custom Utilities
// ============================================================================

// Note: Most Voltaire Blob utilities are specific to KZG proof verification
// and blob data encoding/decoding. These should be evaluated for integration
// or kept as extensions if not provided by Ox.

// TODO: Evaluate which custom functions from old Blob module should be exposed:
// - splitData / joinData (data splitting for multiple blobs)
// - isValid / isValidVersion (validation utilities)
// - calculateGas / estimateBlobCount (gas estimation)
// - verify / verifyBatch (proof verification)
//
// If keeping Voltaire extensions, import them here:
// export { splitData, joinData, isValid, calculateGas, estimateBlobCount, verify, verifyBatch } from './extensions/index.js'
