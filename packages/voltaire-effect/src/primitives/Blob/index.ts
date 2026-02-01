/**
 * @fileoverview Blob module for EIP-4844 blob data.
 *
 * EIP-4844 introduces "blobs" - large data structures (128KB each) that can be
 * attached to transactions for data availability. Blobs are used for Layer 2
 * rollup data and are significantly cheaper than calldata.
 *
 * This module provides Effect-based schemas and functions for creating,
 * validating, and working with blob data.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 *
 * function processBlob(blob: Blob.BrandedBlob) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Blob.Schema` | Uint8Array | BrandedBlob | Validates exactly 131072 bytes |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * Blob.from(bytes)       // Effect<BrandedBlob, InvalidBlobDataSizeError>
 * Blob.fromData(data)    // Effect<BrandedBlob, InvalidBlobDataSizeError>
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * Blob.isValid(data)        // boolean - check if exactly 128KB
 * Blob.isValidVersion(hash) // boolean - check versioned hash version byte
 * Blob.toData(blob)         // Uint8Array - extract original data
 * ```
 *
 * ## Effectful Functions
 *
 * ```typescript
 * Blob.calculateGas(count)       // Effect<number, InvalidBlobCountError>
 * Blob.estimateBlobCount(size)   // Effect<number, InvalidBlobDataSizeError>
 * Blob.splitData(data)           // Effect<BrandedBlob[], InvalidBlobDataSizeError>
 * Blob.joinData(blobs)           // Effect<Uint8Array, BlobError>
 * Blob.toCommitment(blob)        // Effect<Commitment, KZGError, KZGService>
 * Blob.toProof(blob, commitment) // Effect<Proof, KZGError, KZGService>
 * Blob.toVersionedHash(commitment) // Effect<VersionedHash, InvalidCommitmentSizeError>
 * Blob.verify(blob, commitment, proof) // Effect<boolean, KZGError, KZGService>
 * Blob.verifyBatch(blobs, commitments, proofs) // Effect<boolean, BlobError>
 * ```
 *
 * @example
 * ```typescript
 * import * as Blob from 'voltaire-effect/primitives/Blob'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a blob from arbitrary data (will be padded)
 * const blob = await Effect.runPromise(Blob.fromData(data))
 *
 * // Extract the original data
 * const retrieved = Blob.toData(blob)
 *
 * // Check if data is valid blob size
 * if (Blob.isValid(data)) {
 *   const exactBlob = await Effect.runPromise(Blob.from(data))
 * }
 * ```
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 * @module Blob
 * @since 0.0.1
 */

// Re-export types from voltaire
export type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "@tevm/voltaire/Blob";

// Re-export constants from voltaire
export {
	BYTES_PER_FIELD_ELEMENT,
	FIELD_ELEMENTS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
	COMMITMENT_VERSION_KZG,
	GAS_PER_BLOB,
	TARGET_GAS_PER_BLOCK,
	MAX_DATA_PER_BLOB,
} from "@tevm/voltaire/Blob";

// Re-export errors from voltaire
export {
	BlobArrayLengthMismatchError,
	BlobNotImplementedError,
	InvalidBlobCountError,
	InvalidBlobDataSizeError,
	InvalidBlobLengthPrefixError,
	InvalidBlobSizeError,
	InvalidCommitmentSizeError,
	InvalidProofSizeError,
} from "@tevm/voltaire/Blob";

// Re-export factory functions from voltaire (for advanced use/DI)
export {
	Blob,
	ToCommitment,
	ToProof,
	ToVersionedHash,
	Verify,
	VerifyBatch,
} from "@tevm/voltaire/Blob";

// Schema
export { BlobSchema, BlobSchema as Schema } from "./BlobSchema.js";

// Constructors (Effect-wrapped)
export { from } from "./from.js";
export { fromData } from "./fromData.js";

// Pure functions
export { isValid } from "./isValid.js";
export { isValidVersion } from "./isValidVersion.js";
export { toData } from "./toData.js";

// Effectful functions
export { calculateGas } from "./calculateGas.js";
export { estimateBlobCount } from "./estimateBlobCount.js";
export { joinData } from "./joinData.js";
export { splitData } from "./splitData.js";
export { toCommitment } from "./toCommitment.js";
export { toProof } from "./toProof.js";
export { toVersionedHash } from "./toVersionedHash.js";
export { verify } from "./verify.js";
export { verifyBatch } from "./verifyBatch.js";
