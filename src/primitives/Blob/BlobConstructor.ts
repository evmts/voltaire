import type {
	BrandedBlob,
	Commitment,
	Proof,
	VersionedHash,
} from "./BlobType.js";
import type { calculateGas } from "./calculateGas.js";
import type { estimateBlobCount } from "./estimateBlobCount.js";
import type { from } from "./from.js";
import type { fromData } from "./fromData.js";
import type { isValid } from "./isValid.js";
import type { isValidVersion } from "./isValidVersion.js";
import type { joinData } from "./joinData.js";
import type { splitData } from "./splitData.js";
import type { ToCommitment } from "./toCommitment.js";
import type { toData } from "./toData.js";
import type { ToProof } from "./toProof.js";
import type { ToVersionedHash } from "./toVersionedHash.js";
import type { Verify } from "./verify.js";
import type { verifyBatch } from "./verifyBatch.js";

type BlobPrototype = BrandedBlob & {
	toData: typeof toData;
	toCommitment: ReturnType<typeof ToCommitment>;
	toProof: ReturnType<typeof ToProof>;
	verify: ReturnType<typeof Verify>;
};

export interface BlobConstructor {
	(value: Uint8Array): BrandedBlob;
	prototype: BlobPrototype;
	from: typeof from;
	fromData: typeof fromData;
	isValid: typeof isValid;
	toData: typeof toData;
	toCommitment: ReturnType<typeof ToCommitment>;
	toProof: ReturnType<typeof ToProof>;
	toVersionedHash: ReturnType<typeof ToVersionedHash>;
	verify: ReturnType<typeof Verify>;
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
