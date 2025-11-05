import type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BrandedBlob/BrandedBlob.js";
import type { calculateGas } from "./BrandedBlob/calculateGas.js";
import type { estimateBlobCount } from "./BrandedBlob/estimateBlobCount.js";
import type { from } from "./BrandedBlob/from.js";
import type { fromData } from "./BrandedBlob/fromData.js";
import type { isValid } from "./BrandedBlob/isValid.js";
import type { isValidVersion } from "./BrandedBlob/isValidVersion.js";
import type { joinData } from "./BrandedBlob/joinData.js";
import type { splitData } from "./BrandedBlob/splitData.js";
import type { toCommitment } from "./BrandedBlob/toCommitment.js";
import type { toData } from "./BrandedBlob/toData.js";
import type { toProof } from "./BrandedBlob/toProof.js";
import type { toVersionedHash } from "./BrandedBlob/toVersionedHash.js";
import type { verify } from "./BrandedBlob/verify.js";
import type { verifyBatch } from "./BrandedBlob/verifyBatch.js";

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
