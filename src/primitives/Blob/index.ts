export * from "./constants.js";
export * from "./errors.js";

import type {
	BrandedBlob,
	Commitment as CommitmentType,
	Proof as ProofType,
	VersionedHash as VersionedHashType,
} from "./BlobType.js";

// Re-export types with original names
export type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BlobType.js";

// Import functions with proper type annotations
import { calculateGas as _calculateGas } from "./calculateGas.js";
import {
	BYTES_PER_FIELD_ELEMENT,
	COMMITMENT_VERSION_KZG,
	FIELD_ELEMENTS_PER_BLOB,
	GAS_PER_BLOB,
	MAX_PER_TRANSACTION,
	SIZE,
	TARGET_GAS_PER_BLOCK,
} from "./constants.js";
import {
	BlobArrayLengthMismatchError,
	BlobNotImplementedError,
	InvalidBlobCountError,
	InvalidBlobSizeError,
	InvalidCommitmentSizeError,
	InvalidProofSizeError,
} from "./errors.js";
import { estimateBlobCount as _estimateBlobCount } from "./estimateBlobCount.js";
import { from as _from } from "./from.js";
import { fromData as _fromData } from "./fromData.js";
import { isValid as _isValid } from "./isValid.js";
import { isValidVersion as _isValidVersion } from "./isValidVersion.js";
import { joinData as _joinData } from "./joinData.js";
import { splitData as _splitData } from "./splitData.js";
// Import factories with proper type annotations
import { ToCommitment as _ToCommitment } from "./toCommitment.js";
import { toData as _toData } from "./toData.js";
import { ToProof as _ToProof } from "./toProof.js";
import { ToVersionedHash as _ToVersionedHash } from "./toVersionedHash.js";
import { Verify as _Verify } from "./verify.js";
import { VerifyBatch as _VerifyBatch } from "./verifyBatch.js";

// Type-safe wrappers
const calculateGas: (blobCount: number) => number = _calculateGas;
const estimateBlobCount: (dataSize: number) => number = _estimateBlobCount;
const from: (value: Uint8Array) => BrandedBlob = _from;
const fromData: (data: Uint8Array) => BrandedBlob = _fromData;
const isValid: (blob: Uint8Array) => boolean = _isValid;
const isValidVersion: (hash: VersionedHashType) => boolean = _isValidVersion;
const joinData: (blobs: readonly BrandedBlob[]) => Uint8Array = _joinData;
const splitData: (data: Uint8Array) => BrandedBlob[] = _splitData;
const toData: (blob: BrandedBlob) => Uint8Array = _toData;

const ToCommitment: (deps: {
	blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
}) => (blob: BrandedBlob) => CommitmentType = _ToCommitment;
const ToProof = _ToProof as (deps: {
	computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
}) => (blob: BrandedBlob, commitment: CommitmentType) => ProofType;
const ToVersionedHash: (deps: {
	sha256: (data: Uint8Array) => Uint8Array;
}) => (commitment: CommitmentType) => VersionedHashType = _ToVersionedHash;
const Verify: (deps: {
	verifyBlobKzgProof: (
		blob: Uint8Array,
		commitment: Uint8Array,
		proof: Uint8Array,
	) => boolean;
}) => (
	blob: BrandedBlob,
	commitment: CommitmentType,
	proof: ProofType,
) => boolean = _Verify;

const VerifyBatch: (deps: {
	verifyBlobKzgProofBatch: (
		blobs: Uint8Array[],
		commitments: Uint8Array[],
		proofs: Uint8Array[],
	) => boolean;
}) => (
	blobs: readonly BrandedBlob[],
	commitments: readonly CommitmentType[],
	proofs: readonly ProofType[],
) => boolean = _VerifyBatch;

// Import KZG functions from crypto module
// Note: KZG is native-only, these will throw in WASM/browser environments
import {
	blobToKzgCommitment,
	computeBlobKzgProof,
	verifyBlobKzgProof,
} from "../../crypto/KZG/index.js";
// Import crypto dependencies
import { hash as sha256 } from "../../crypto/SHA256/hash.js";

// Create wrapper functions with crypto auto-injected
// Note: KZG functions require native FFI - will throw in WASM/browser
export const toVersionedHash = ToVersionedHash({ sha256 });
export const toCommitment = ToCommitment({
	blobToKzgCommitment,
});
export const toProof = ToProof({
	computeBlobKzgProof,
});
export const verify = Verify({ verifyBlobKzgProof });
// Batch verification is not implemented on the Blob static API yet.
// Perform validations for developer feedback, then throw.
/**
 * Verify batch of blobs with commitments and proofs
 *
 * @throws {BlobArrayLengthMismatchError} If array lengths don't match
 * @throws {InvalidBlobCountError} If too many blobs
 * @throws {InvalidBlobSizeError} If blob size is invalid
 * @throws {InvalidCommitmentSizeError} If commitment size is invalid
 * @throws {InvalidProofSizeError} If proof size is invalid
 * @throws {BlobNotImplementedError} Always (not yet implemented)
 */
export const verifyBatch = ((
	blobs: readonly BrandedBlob[],
	commitments: readonly CommitmentType[],
	proofs: readonly ProofType[],
): boolean => {
	// Basic validations to mirror factory behavior
	if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
		throw new BlobArrayLengthMismatchError("Arrays must have same length", {
			value: {
				blobs: blobs.length,
				commitments: commitments.length,
				proofs: proofs.length,
			},
			expected: "equal array lengths",
		});
	}
	if (blobs.length > MAX_PER_TRANSACTION) {
		throw new InvalidBlobCountError("Too many blobs", {
			value: blobs.length,
			expected: `max ${MAX_PER_TRANSACTION} blobs`,
		});
	}
	for (let i = 0; i < blobs.length; i++) {
		const blob = blobs[i] as Uint8Array;
		if (blob.length !== SIZE) {
			throw new InvalidBlobSizeError("Invalid blob size", {
				value: blob.length,
				expected: `${SIZE} bytes`,
				context: { index: i },
			});
		}
	}
	for (let i = 0; i < commitments.length; i++) {
		const commitment = commitments[i] as unknown as Uint8Array;
		if (commitment.length !== 48) {
			throw new InvalidCommitmentSizeError("Invalid commitment size", {
				value: commitment.length,
				expected: "48 bytes",
				context: { index: i },
			});
		}
	}
	for (let i = 0; i < proofs.length; i++) {
		const proof = proofs[i] as unknown as Uint8Array;
		if (proof.length !== 48) {
			throw new InvalidProofSizeError("Invalid proof size", {
				value: proof.length,
				expected: "48 bytes",
				context: { index: i },
			});
		}
	}
	throw new BlobNotImplementedError("Not implemented", {
		value: "verifyBatch",
		expected: "implementation",
	});
}) as (
	blobs: readonly BrandedBlob[],
	commitments: readonly CommitmentType[],
	proofs: readonly ProofType[],
) => boolean;

// Export individual functions
export {
	from,
	fromData,
	isValid,
	toData,
	isValidVersion,
	calculateGas,
	estimateBlobCount,
	splitData,
	joinData,
};

// Nested namespaces for Commitment, Proof, and VersionedHash
export const CommitmentNamespace = {
	isValid: (commitment: Uint8Array): boolean => {
		return commitment.length === 48;
	},
	toVersionedHash: (commitment: CommitmentType): VersionedHashType => {
		return toVersionedHash(commitment);
	},
};

export const ProofNamespace = {
	isValid: (proof: Uint8Array): boolean => {
		return proof.length === 48;
	},
};

export const VersionedHashNamespace = {
	isValid: (hash: Uint8Array): boolean => {
		return hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG;
	},
	getVersion: (hash: Uint8Array): number => {
		return hash[0] ?? 0;
	},
	version: (hash: Uint8Array): number => {
		return hash[0] ?? 0;
	},
};

// Namespace export for BrandedBlob
const BrandedBlobNamespace = {
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
	Commitment: CommitmentNamespace,
	Proof: ProofNamespace,
	VersionedHash: VersionedHashNamespace,
};

// Re-export factory functions for tree-shaking
export { ToVersionedHash, ToCommitment, ToProof, Verify, VerifyBatch };

/**
 * Creates a Blob instance from various input types.
 *
 * Canonical Class API constructor. Supports:
 * - Number (creates empty blob of specified size)
 * - Raw blob data (131072 bytes)
 * - Data to encode (auto-encodes with length prefix)
 *
 * @param value - Number for size or Uint8Array (either 131072 bytes blob or data to encode)
 * @returns Blob instance
 * @throws Error if data exceeds maximum size
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
export function Blob(value: number | Uint8Array): BrandedBlob & BlobInstance {
	// If value is a number, create an empty blob of that size
	let bytes: Uint8Array;
	if (typeof value === "number") {
		bytes = new Uint8Array(value);
	} else {
		bytes = value;
	}
	const result = BrandedBlobNamespace.from(bytes);
	Object.setPrototypeOf(result, Blob.prototype);
	return result as BrandedBlob & BlobInstance;
}

// Instance method interface
export interface BlobInstance {
	toData(): Uint8Array;
	toCommitment(): CommitmentType;
	toProof(commitment: CommitmentType): ProofType;
	verify(commitment: CommitmentType, proof: ProofType): boolean;
}

/**
 * Alias for Blob() constructor.
 *
 * @deprecated Use `Blob()` constructor instead
 */
Blob.from = (value: Uint8Array): BrandedBlob & BlobInstance => {
	const result = BrandedBlobNamespace.from(value);
	Object.setPrototypeOf(result, Blob.prototype);
	return result as BrandedBlob & BlobInstance;
};
Blob.from.prototype = Blob.prototype;

Blob.fromData = (value: Uint8Array): BrandedBlob & BlobInstance => {
	const result = BrandedBlobNamespace.fromData(value);
	Object.setPrototypeOf(result, Blob.prototype);
	return result as BrandedBlob & BlobInstance;
};
Blob.fromData.prototype = Blob.prototype;

// Static utility methods (don't return Blob instances)
Blob.isValid = BrandedBlobNamespace.isValid;
Blob.toData = BrandedBlobNamespace.toData;
Blob.toCommitment = BrandedBlobNamespace.toCommitment;
Blob.toProof = BrandedBlobNamespace.toProof;
Blob.toVersionedHash = BrandedBlobNamespace.toVersionedHash;
Blob.verify = BrandedBlobNamespace.verify;
Blob.verifyBatch = BrandedBlobNamespace.verifyBatch;
Blob.isValidVersion = BrandedBlobNamespace.isValidVersion;
Blob.calculateGas = BrandedBlobNamespace.calculateGas;
Blob.estimateBlobCount = BrandedBlobNamespace.estimateBlobCount;
Blob.splitData = BrandedBlobNamespace.splitData;
Blob.joinData = BrandedBlobNamespace.joinData;

// Constants
Blob.SIZE = BrandedBlobNamespace.SIZE;
Blob.FIELD_ELEMENTS_PER_BLOB = BrandedBlobNamespace.FIELD_ELEMENTS_PER_BLOB;
Blob.BYTES_PER_FIELD_ELEMENT = BrandedBlobNamespace.BYTES_PER_FIELD_ELEMENT;
Blob.MAX_PER_TRANSACTION = BrandedBlobNamespace.MAX_PER_TRANSACTION;
Blob.COMMITMENT_VERSION_KZG = BrandedBlobNamespace.COMMITMENT_VERSION_KZG;
Blob.GAS_PER_BLOB = BrandedBlobNamespace.GAS_PER_BLOB;
Blob.TARGET_GAS_PER_BLOCK = BrandedBlobNamespace.TARGET_GAS_PER_BLOCK;

// Nested namespaces
Blob.Commitment = BrandedBlobNamespace.Commitment;
Blob.Proof = BrandedBlobNamespace.Proof;
Blob.VersionedHash = BrandedBlobNamespace.VersionedHash;

// Set up Blob.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(Blob.prototype, Uint8Array.prototype);

// Instance methods
Blob.prototype.toData = function (this: BrandedBlob): Uint8Array {
	return BrandedBlobNamespace.toData(this);
};
Blob.prototype.toCommitment = function (this: BrandedBlob): CommitmentType {
	return BrandedBlobNamespace.toCommitment(this);
};
Blob.prototype.toProof = function (
	this: BrandedBlob,
	commitment: CommitmentType,
): ProofType {
	return BrandedBlobNamespace.toProof(this, commitment);
};
Blob.prototype.verify = function (
	this: BrandedBlob,
	commitment: CommitmentType,
	proof: ProofType,
): boolean {
	return BrandedBlobNamespace.verify(this, commitment, proof);
};
