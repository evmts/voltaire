import type { BrandedBlob, Commitment, Proof, VersionedHash } from "./BrandedBlob.js";
import type { from } from "./from.js";
import type { fromData } from "./fromData.js";
import type { isValid } from "./isValid.js";
import type { toData } from "./toData.js";
import type { toCommitment } from "./toCommitment.js";
import type { toProof } from "./toProof.js";
import type { toVersionedHash } from "./toVersionedHash.js";
import type { verify } from "./verify.js";
import type { verifyBatch } from "./verifyBatch.js";
import type { isValidVersion } from "./isValidVersion.js";
import type { calculateGas } from "./calculateGas.js";
import type { estimateBlobCount } from "./estimateBlobCount.js";
import type { splitData } from "./splitData.js";
import type { joinData } from "./joinData.js";

type BlobPrototype = BrandedBlob & {
	toData: typeof toData;
	toCommitment: typeof toCommitment;
	toProof: typeof toProof;
	verify: typeof verify;
};

export interface BlobConstructor {
	(value: Uint8Array): BrandedBlob;
	prototype: BlobPrototype;
	from: typeof from;
	fromData: typeof fromData;
	isValid: typeof isValid;
	toData: typeof toData;
	toCommitment: typeof toCommitment;
	toProof: typeof toProof;
	toVersionedHash: typeof toVersionedHash;
	verify: typeof verify;
	verifyBatch: typeof verifyBatch;
	isValidVersion: typeof isValidVersion;
	calculateGas: typeof calculateGas;
	estimateBlobCount: typeof estimateBlobCount;
	splitData: typeof splitData;
	joinData: typeof joinData;
	SIZE: number;
	FIELD_ELEMENTS_PER_BLOB: number;
	BYTES_PER_FIELD_ELEMENT: number;
	MAX_PER_TRANSACTION: number;
	COMMITMENT_VERSION_KZG: number;
	GAS_PER_BLOB: number;
	TARGET_GAS_PER_BLOCK: number;
	Commitment: {
		isValid: (commitment: Uint8Array) => commitment is Commitment;
		toVersionedHash: (commitment: Commitment) => VersionedHash;
	};
	Proof: {
		isValid: (proof: Uint8Array) => proof is Proof;
	};
	VersionedHash: {
		isValid: (hash: Uint8Array) => hash is VersionedHash;
		getVersion: (hash: VersionedHash) => number;
		version: (hash: VersionedHash) => number;
	};
}
