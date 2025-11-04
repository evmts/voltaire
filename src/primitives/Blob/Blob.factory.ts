/**
 * Blob (EIP-4844) Types and Utilities
 *
 * Complete blob encoding/decoding, KZG commitments, and versioned hashes.
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Blob } from './Blob.js';
 *
 * // Factory function
 * const blob = Blob(new Uint8Array(131072));
 *
 * // Static methods
 * const data = Blob.toData(blob);
 * const commitment = Blob.toCommitment(blob);
 *
 * // Instance methods
 * const data2 = blob.toData();
 * const commitment2 = blob.toCommitment();
 * ```
 */

// Import types
import type { BlobConstructor } from "./BlobConstructor.js";
import type { Commitment, Proof, VersionedHash } from "./BrandedBlob.js";

// Import all method functions
import { calculateGas } from "./calculateGas.js";
import * as constants from "./constants.js";
import { estimateBlobCount } from "./estimateBlobCount.js";
import { from as fromValue } from "./from.js";
import { fromData } from "./fromData.js";
import { isValid } from "./isValid.js";
import { isValidVersion } from "./isValidVersion.js";
import { joinData } from "./joinData.js";
import { splitData } from "./splitData.js";
import { toCommitment } from "./toCommitment.js";
import { toData } from "./toData.js";
import { toProof } from "./toProof.js";
import { toVersionedHash } from "./toVersionedHash.js";
import { verify } from "./verify.js";
import { verifyBatch } from "./verifyBatch.js";

// Re-export types
export * from "./BrandedBlob.js";
export * from "./constants.js";

// Re-export method functions for tree-shaking
export {
	calculateGas,
	estimateBlobCount,
	fromData,
	fromValue as from,
	isValid,
	isValidVersion,
	joinData,
	splitData,
	toCommitment,
	toData,
	toProof,
	toVersionedHash,
	verify,
	verifyBatch,
};

/**
 * Factory function for creating Blob instances
 */
export const Blob = ((value: Uint8Array) => {
	return fromValue(value);
}) as BlobConstructor;

// Initialize prototype
Blob.prototype = {} as any;

// Attach static methods
Blob.from = fromValue;
Blob.fromData = fromData;
Blob.isValid = isValid;
Blob.toData = toData;
Blob.toCommitment = toCommitment;
Blob.toProof = toProof;
Blob.toVersionedHash = toVersionedHash;
Blob.verify = verify;
Blob.verifyBatch = verifyBatch;
Blob.isValidVersion = isValidVersion;
Blob.calculateGas = calculateGas;
Blob.estimateBlobCount = estimateBlobCount;
Blob.splitData = splitData;
Blob.joinData = joinData;

// Attach constants
Blob.SIZE = constants.SIZE;
Blob.FIELD_ELEMENTS_PER_BLOB = constants.FIELD_ELEMENTS_PER_BLOB;
Blob.BYTES_PER_FIELD_ELEMENT = constants.BYTES_PER_FIELD_ELEMENT;
Blob.MAX_PER_TRANSACTION = constants.MAX_PER_TRANSACTION;
Blob.COMMITMENT_VERSION_KZG = constants.COMMITMENT_VERSION_KZG;
Blob.GAS_PER_BLOB = constants.GAS_PER_BLOB;
Blob.TARGET_GAS_PER_BLOCK = constants.TARGET_GAS_PER_BLOCK;

// Bind prototype methods using Function.prototype.call.bind
Blob.prototype.toData = Function.prototype.call.bind(toData) as any;
Blob.prototype.toCommitment = Function.prototype.call.bind(toCommitment) as any;
Blob.prototype.toProof = Function.prototype.call.bind(toProof) as any;
Blob.prototype.verify = Function.prototype.call.bind(verify) as any;

// Nested namespaces
Blob.Commitment = {
	isValid: (commitment: Uint8Array): commitment is Commitment => {
		return commitment.length === 48;
	},
	toVersionedHash: (commitment: Commitment): VersionedHash => {
		return toVersionedHash(commitment);
	},
};

Blob.Proof = {
	isValid: (proof: Uint8Array): proof is Proof => {
		return proof.length === 48;
	},
};

Blob.VersionedHash = {
	isValid: (hash: Uint8Array): hash is VersionedHash => {
		return hash.length === 32 && hash[0] === constants.COMMITMENT_VERSION_KZG;
	},
	getVersion: (hash: VersionedHash): number => {
		return hash[0] ?? 0;
	},
	version: (hash: VersionedHash): number => {
		return hash[0] ?? 0;
	},
};
