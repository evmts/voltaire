// @ts-nocheck
export * from "./constants.js";
export type * from "../BrandedBlob.js";

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
import { hash as sha256 } from "../../../crypto/SHA256/hash.js";

// Import factories
export { ToVersionedHash } from "./toVersionedHash.js";
export { ToCommitment } from "./toCommitment.js";
export { ToProof } from "./toProof.js";
export { Verify } from "./verify.js";

import { ToCommitment } from "./toCommitment.js";
import { ToProof } from "./toProof.js";
// Create wrappers with stubbed KZG functions (until c-kzg-4844 is integrated)
import { ToVersionedHash } from "./toVersionedHash.js";
import { Verify } from "./verify.js";

// Stub KZG functions (will throw until c-kzg-4844 is integrated)
const stubBlobToKzgCommitment = () => {
	throw new Error("Not implemented: requires c-kzg-4844 library");
};
const stubComputeBlobKzgProof = () => {
	throw new Error("Not implemented: requires c-kzg-4844 library");
};
const stubVerifyBlobKzgProof = () => {
	throw new Error("Not implemented: requires c-kzg-4844 library");
};

// Create wrapper functions with crypto auto-injected
export const toVersionedHash = ToVersionedHash({ sha256 });
export const toCommitment = ToCommitment({
	blobToKzgCommitment: stubBlobToKzgCommitment,
});
export const toProof = ToProof({
	computeBlobKzgProof: stubComputeBlobKzgProof,
});
export const verify = Verify({ verifyBlobKzgProof: stubVerifyBlobKzgProof });

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

// Namespace export
export const BrandedBlob = {
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
