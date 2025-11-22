// @ts-nocheck
export * from "./constants.js";
export type * from "./BlobType.js";

import { calculateGas } from "./calculateGas.js";
import {
	BYTES_PER_FIELD_ELEMENT,
	COMMITMENT_VERSION_KZG,
	FIELD_ELEMENTS_PER_BLOB,
	GAS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
	TARGET_GAS_PER_BLOCK,
} from "./constants.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { from } from "./from.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";
import { isValidVersion } from "./isValidVersion.js";
import { joinData } from "./joinData.js";
import { splitData } from "./splitData.js";
import { toData } from "./toData.js";
import { verifyBatch } from "./verifyBatch.js";

// Import crypto dependencies
import { hash as sha256 } from "../../crypto/SHA256/hash.js";

// Import factories
export { ToVersionedHash } from "./toVersionedHash.js";
export { ToCommitment } from "./toCommitment.js";
export { ToProof } from "./toProof.js";
export { Verify } from "./verify.js";

import { ToCommitment } from "./toCommitment.js";
import { ToProof } from "./toProof.js";
import { ToVersionedHash } from "./toVersionedHash.js";
import { Verify } from "./verify.js";

// Import KZG functions from crypto module
import {
	blobToKzgCommitment,
	computeKzgProof,
	verifyBlobKzgProof,
} from "../../crypto/KZG/index.js";

// Create wrapper functions with crypto auto-injected
export const toVersionedHash = ToVersionedHash({ sha256 });
export const toCommitment = ToCommitment({
	blobToKzgCommitment,
});
export const toProof = ToProof({
	computeBlobKzgProof: computeKzgProof,
});
export const verify = Verify({ verifyBlobKzgProof });

// Export individual functions
export {
	from,
	fromData,
	isValid,
	toData,
	verifyBatch,
	isValidVersion,
	calculateGas,
	estimateBlobCount,
	splitData,
	joinData,
};

// Nested namespaces for Commitment, Proof, and VersionedHash
export const Commitment = {
	isValid: (commitment) => {
		return commitment.length === 48;
	},
	toVersionedHash: (commitment) => {
		return toVersionedHash(commitment);
	},
};

export const Proof = {
	isValid: (proof) => {
		return proof.length === 48;
	},
};

export const VersionedHash = {
	isValid: (hash) => {
		return hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG;
	},
	getVersion: (hash) => {
		return hash[0] ?? 0;
	},
	version: (hash) => {
		return hash[0] ?? 0;
	},
};

// Namespace export for BrandedBlob
const BrandedBlob = {
	from,
	fromData,
	isValid,
	toData,
	toCommitment,
	toProof,
	toVersionedHash,
	verify,
	verifyBatch,
	isValidVersion,
	calculateGas,
	estimateBlobCount,
	splitData,
	joinData,
	SIZE,
	FIELD_ELEMENTS_PER_BLOB,
	BYTES_PER_FIELD_ELEMENT,
	MAX_PER_TRANSACTION,
	COMMITMENT_VERSION_KZG,
	GAS_PER_BLOB,
	TARGET_GAS_PER_BLOCK,
	Commitment,
	Proof,
	VersionedHash,
};

// Re-export BrandedBlob type and constants
export type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BlobType.js";

// Re-export factory functions for tree-shaking
export { ToVersionedHash, ToCommitment, ToProof, Verify };

/**
 * Creates a Blob instance from various input types.
 *
 * Canonical Class API constructor. Supports:
 * - Number (creates empty blob of specified size)
 * - Raw blob data (131072 bytes)
 * - Data to encode (auto-encodes with length prefix)
 *
 * @param {number | Uint8Array} value - Number for size or Uint8Array (either 131072 bytes blob or data to encode)
 * @returns {Blob} Blob instance
 * @throws {Error} If data exceeds maximum size
 *
 * @example
 * ```typescript
 * import { Blob } from './primitives/Blob/index.js';
 *
 * // Create empty blob by size
 * const blob1 = Blob(131072);
 *
 * // Raw blob
 * const blob2 = Blob(new Uint8Array(131072));
 *
 * // Auto-encode data
 * const blob3 = Blob(new TextEncoder().encode("Hello"));
 * ```
 */
export function Blob(value) {
	// If value is a number, create an empty blob of that size
	if (typeof value === "number") {
		value = new Uint8Array(value);
	}
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
