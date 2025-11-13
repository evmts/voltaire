// @ts-nocheck
import * as BrandedBlob from "./BrandedBlob/index.js";

// Re-export BrandedBlob type and constants
export type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BrandedBlob.js";
export * from "./BrandedBlob/constants.js";

// Re-export factory functions for tree-shaking
export {
	ToVersionedHash,
	ToCommitment,
	ToProof,
	Verify,
} from "./BrandedBlob/index.js";

/**
 * Creates a Blob instance from various input types.
 *
 * Canonical Class API constructor. Supports:
 * - Raw blob data (131072 bytes)
 * - Data to encode (auto-encodes with length prefix)
 *
 * @param {Uint8Array} value - Uint8Array (either 131072 bytes blob or data to encode)
 * @returns {Blob} Blob instance
 * @throws {Error} If data exceeds maximum size
 *
 * @example
 * ```typescript
 * import { Blob } from './primitives/Blob/index.js';
 *
 * // Raw blob
 * const blob1 = Blob(new Uint8Array(131072));
 *
 * // Auto-encode data
 * const blob2 = Blob(new TextEncoder().encode("Hello"));
 * ```
 */
export function Blob(value) {
	const result = BrandedBlob.from(value);
	Object.setPrototypeOf(result, Blob.prototype);
	return result;
}

/**
 * Alias for Blob() constructor.
 *
 * @deprecated Use `Blob()` constructor instead
 */
Blob.from = (value) => {
	const result = BrandedBlob.from(value);
	Object.setPrototypeOf(result, Blob.prototype);
	return result;
};
Blob.from.prototype = Blob.prototype;

Blob.fromData = (value) => {
	const result = BrandedBlob.fromData(value);
	Object.setPrototypeOf(result, Blob.prototype);
	return result;
};
Blob.fromData.prototype = Blob.prototype;

// Static utility methods (don't return Blob instances)
Blob.isValid = BrandedBlob.isValid;
Blob.toData = BrandedBlob.toData;
Blob.toCommitment = BrandedBlob.toCommitment;
Blob.toProof = BrandedBlob.toProof;
Blob.toVersionedHash = BrandedBlob.toVersionedHash;
Blob.verify = BrandedBlob.verify;
Blob.verifyBatch = BrandedBlob.verifyBatch;
Blob.isValidVersion = BrandedBlob.isValidVersion;
Blob.calculateGas = BrandedBlob.calculateGas;
Blob.estimateBlobCount = BrandedBlob.estimateBlobCount;
Blob.splitData = BrandedBlob.splitData;
Blob.joinData = BrandedBlob.joinData;

// Constants
Blob.SIZE = BrandedBlob.SIZE;
Blob.FIELD_ELEMENTS_PER_BLOB = BrandedBlob.FIELD_ELEMENTS_PER_BLOB;
Blob.BYTES_PER_FIELD_ELEMENT = BrandedBlob.BYTES_PER_FIELD_ELEMENT;
Blob.MAX_PER_TRANSACTION = BrandedBlob.MAX_PER_TRANSACTION;
Blob.COMMITMENT_VERSION_KZG = BrandedBlob.COMMITMENT_VERSION_KZG;
Blob.GAS_PER_BLOB = BrandedBlob.GAS_PER_BLOB;
Blob.TARGET_GAS_PER_BLOCK = BrandedBlob.TARGET_GAS_PER_BLOCK;

// Nested namespaces
Blob.Commitment = BrandedBlob.Commitment;
Blob.Proof = BrandedBlob.Proof;
Blob.VersionedHash = BrandedBlob.VersionedHash;

// Set up Blob.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Blob.prototype, Uint8Array.prototype);

// Instance methods
Blob.prototype.toData = function () {
	return BrandedBlob.toData(this);
};
Blob.prototype.toCommitment = function () {
	return BrandedBlob.toCommitment(this);
};
Blob.prototype.toProof = function () {
	return BrandedBlob.toProof(this);
};
Blob.prototype.verify = function () {
	return BrandedBlob.verify(this);
};
