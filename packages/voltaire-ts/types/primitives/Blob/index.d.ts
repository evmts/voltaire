export type { BlobScheduleType, CalculateExcessBlobGasOptions, ExcessBlobGasOptions, } from "../FeeMarket/BlobScheduleType.js";
import { calculateBlobBaseFee } from "../FeeMarket/calculateBlobBaseFee.js";
import { calculateExcessBlobGas, calculateExcessBlobGasEip7918 } from "../FeeMarket/calculateExcessBlobGas.js";
import { blobScheduleForHardfork, blobScheduleForTimestamp, getBlobSchedule } from "../FeeMarket/getBlobSchedule.js";
export declare const BlobSchedule: Readonly<{
    forHardfork: typeof blobScheduleForHardfork;
    forTimestamp: typeof blobScheduleForTimestamp;
    GAS_PER_BLOB: 131072n;
    MIN_BLOB_BASE_FEE: 1n;
    BLOB_BASE_COST: 8192n;
    CANCUN: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    PRAGUE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    OSAKA: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    BPO1: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    BPO2: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    CANCUN_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    PRAGUE_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    OSAKA_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    BPO1_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    BPO2_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
    CANCUN_TIMESTAMP: 1710338135n;
    PRAGUE_TIMESTAMP: 1746612311n;
    OSAKA_TIMESTAMP: 1764798551n;
    BPO1_TIMESTAMP: 1765290071n;
    BPO2_TIMESTAMP: 1767747671n;
}>;
export * from "./constants.js";
export * from "./errors.js";
export { calculateBlobBaseFee, calculateExcessBlobGas, calculateExcessBlobGasEip7918, getBlobSchedule, };
import type { BrandedBlob, Commitment as CommitmentType, Proof as ProofType, VersionedHash as VersionedHashType } from "./BlobType.js";
export type { BrandedBlob, Commitment, Proof, VersionedHash, } from "./BlobType.js";
declare const calculateGas: (blobCount: number) => number;
declare const estimateBlobCount: (dataSize: number) => number;
declare const from: (value: Uint8Array) => BrandedBlob;
declare const fromData: (data: Uint8Array) => BrandedBlob;
declare const isValid: (blob: Uint8Array) => boolean;
declare const isValidVersion: (hash: VersionedHashType) => boolean;
declare const joinData: (blobs: readonly BrandedBlob[]) => Uint8Array;
declare const splitData: (data: Uint8Array) => BrandedBlob[];
declare const toData: (blob: BrandedBlob) => Uint8Array;
declare const ToCommitment: (deps: {
    blobToKzgCommitment: (blob: Uint8Array) => Uint8Array;
}) => (blob: BrandedBlob) => CommitmentType;
declare const ToProof: (deps: {
    computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
}) => (blob: BrandedBlob, commitment: CommitmentType) => ProofType;
declare const ToVersionedHash: (deps: {
    sha256: (data: Uint8Array) => Uint8Array;
}) => (commitment: CommitmentType) => VersionedHashType;
declare const Verify: (deps: {
    verifyBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array) => boolean;
}) => (blob: BrandedBlob, commitment: CommitmentType, proof: ProofType) => boolean;
declare const VerifyBatch: (deps: {
    verifyBlobKzgProofBatch: (blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]) => boolean;
}) => (blobs: readonly BrandedBlob[], commitments: readonly CommitmentType[], proofs: readonly ProofType[]) => boolean;
export declare const toVersionedHash: (commitment: CommitmentType) => VersionedHashType;
export declare const toCommitment: (blob: BrandedBlob) => CommitmentType;
export declare const toProof: (blob: BrandedBlob, commitment: CommitmentType) => ProofType;
export declare const verify: (blob: BrandedBlob, commitment: CommitmentType, proof: ProofType) => boolean;
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
export declare const verifyBatch: (blobs: readonly BrandedBlob[], commitments: readonly CommitmentType[], proofs: readonly ProofType[]) => boolean;
export { calculateGas, estimateBlobCount, from, fromData, isValid, isValidVersion, joinData, splitData, toData, };
export declare const CommitmentNamespace: {
    isValid: (commitment: Uint8Array) => boolean;
    toVersionedHash: (commitment: CommitmentType) => VersionedHashType;
};
export declare const ProofNamespace: {
    isValid: (proof: Uint8Array) => boolean;
};
export declare const VersionedHashNamespace: {
    isValid: (hash: Uint8Array) => boolean;
    getVersion: (hash: Uint8Array) => number;
    version: (hash: Uint8Array) => number;
};
export { ToCommitment, ToProof, ToVersionedHash, Verify, VerifyBatch };
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
export declare function Blob(value: number | Uint8Array): BrandedBlob & BlobInstance;
export declare namespace Blob {
    var from: (value: Uint8Array) => BrandedBlob & BlobInstance;
    var fromData: (value: Uint8Array) => BrandedBlob & BlobInstance;
    var isValid: (blob: Uint8Array) => boolean;
    var toData: (blob: BrandedBlob) => Uint8Array;
    var toCommitment: (blob: BrandedBlob) => CommitmentType;
    var toProof: (blob: BrandedBlob, commitment: CommitmentType) => ProofType;
    var toVersionedHash: (commitment: CommitmentType) => VersionedHashType;
    var verify: (blob: BrandedBlob, commitment: CommitmentType, proof: ProofType) => boolean;
    var verifyBatch: (blobs: readonly BrandedBlob[], commitments: readonly CommitmentType[], proofs: readonly ProofType[]) => boolean;
    var isValidVersion: (hash: VersionedHashType) => boolean;
    var calculateGas: (blobCount: number) => number;
    var estimateBlobCount: (dataSize: number) => number;
    var splitData: (data: Uint8Array) => BrandedBlob[];
    var joinData: (blobs: readonly BrandedBlob[]) => Uint8Array;
    var SIZE: number;
    var FIELD_ELEMENTS_PER_BLOB: number;
    var BYTES_PER_FIELD_ELEMENT: number;
    var MAX_PER_TRANSACTION: number;
    var COMMITMENT_VERSION_KZG: number;
    var GAS_PER_BLOB: number;
    var TARGET_GAS_PER_BLOCK: number;
    var BlobSchedule: Readonly<{
        forHardfork: typeof blobScheduleForHardfork;
        forTimestamp: typeof blobScheduleForTimestamp;
        GAS_PER_BLOB: 131072n;
        MIN_BLOB_BASE_FEE: 1n;
        BLOB_BASE_COST: 8192n;
        CANCUN: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        PRAGUE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        OSAKA: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        BPO1: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        BPO2: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        CANCUN_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        PRAGUE_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        OSAKA_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        BPO1_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        BPO2_BLOB_SCHEDULE: Readonly<import("../FeeMarket/BlobScheduleType.js").BlobScheduleType>;
        CANCUN_TIMESTAMP: 1710338135n;
        PRAGUE_TIMESTAMP: 1746612311n;
        OSAKA_TIMESTAMP: 1764798551n;
        BPO1_TIMESTAMP: 1765290071n;
        BPO2_TIMESTAMP: 1767747671n;
    }>;
    var getBlobSchedule: typeof import("../FeeMarket/getBlobSchedule.js").getBlobSchedule;
    var calculateBlobBaseFee: typeof import("../FeeMarket/calculateBlobBaseFee.js").calculateBlobBaseFee;
    var calculateExcessBlobGas: typeof import("../FeeMarket/calculateExcessBlobGas.js").calculateExcessBlobGas;
    var calculateExcessBlobGasEip7918: typeof import("../FeeMarket/calculateExcessBlobGas.js").calculateExcessBlobGasEip7918;
    var Commitment: {
        isValid: (commitment: Uint8Array) => boolean;
        toVersionedHash: (commitment: CommitmentType) => VersionedHashType;
    };
    var Proof: {
        isValid: (proof: Uint8Array) => boolean;
    };
    var VersionedHash: {
        isValid: (hash: Uint8Array) => boolean;
        getVersion: (hash: Uint8Array) => number;
        version: (hash: Uint8Array) => number;
    };
}
export interface BlobInstance {
    toData(): Uint8Array;
    toCommitment(): CommitmentType;
    toProof(commitment: CommitmentType): ProofType;
    verify(commitment: CommitmentType, proof: ProofType): boolean;
}
//# sourceMappingURL=index.d.ts.map