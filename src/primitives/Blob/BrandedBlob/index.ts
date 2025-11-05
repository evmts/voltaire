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
import { toCommitment } from "./toCommitment.js";
import { toData } from "./toData.js";
import { toProof } from "./toProof.js";
import { toVersionedHash } from "./toVersionedHash.js";
import { verify } from "./verify.js";
import { verifyBatch } from "./verifyBatch.js";

// Export individual functions
export {
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
