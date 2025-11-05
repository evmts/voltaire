// @ts-nocheck
export * from "./constants.js";

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

/**
 * @typedef {import('./BrandedBlob.js').BrandedBlob} BrandedBlob
 * @typedef {import('./BrandedBlob.js').Commitment} Commitment
 * @typedef {import('./BrandedBlob.js').Proof} Proof
 * @typedef {import('./BrandedBlob.js').VersionedHash} VersionedHash
 * @typedef {import('./BlobConstructor.js').BlobConstructor} BlobConstructor
 */

/**
 * Factory function for creating Blob instances
 *
 * @type {BlobConstructor}
 */
export function Blob(value) {
	return from(value);
}

Blob.from = (value) => from(value);
Blob.from.prototype = Blob.prototype;
Blob.fromData = (value) => fromData(value);
Blob.fromData.prototype = Blob.prototype;

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

Blob.SIZE = SIZE;
Blob.FIELD_ELEMENTS_PER_BLOB = FIELD_ELEMENTS_PER_BLOB;
Blob.BYTES_PER_FIELD_ELEMENT = BYTES_PER_FIELD_ELEMENT;
Blob.MAX_PER_TRANSACTION = MAX_PER_TRANSACTION;
Blob.COMMITMENT_VERSION_KZG = COMMITMENT_VERSION_KZG;
Blob.GAS_PER_BLOB = GAS_PER_BLOB;
Blob.TARGET_GAS_PER_BLOCK = TARGET_GAS_PER_BLOCK;

Blob.prototype.toData = Function.prototype.call.bind(toData);
Blob.prototype.toCommitment = Function.prototype.call.bind(toCommitment);
Blob.prototype.toProof = Function.prototype.call.bind(toProof);
Blob.prototype.verify = Function.prototype.call.bind(verify);

// Nested namespaces
Blob.Commitment = {
	isValid: (commitment) => {
		return commitment.length === 48;
	},
	toVersionedHash: (commitment) => {
		return toVersionedHash(commitment);
	},
};

Blob.Proof = {
	isValid: (proof) => {
		return proof.length === 48;
	},
};

Blob.VersionedHash = {
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
