/**
 * KZG (EIP-4844) synchronous native implementation using Zig / c-kzg-4844 C ABI.
 * Drop-in 1:1 replacement for pure JS/WASM KZG without WASM overhead.
 */
import { BYTES_PER_BLOB } from "../../crypto/KZG/constants.js";
import { createEmptyBlob } from "../../crypto/KZG/createEmptyBlob.js";
import { generateRandomBlob } from "../../crypto/KZG/generateRandomBlob.js";
import { validateBlob } from "../../crypto/KZG/validateBlob.js";
/**
 * Load KZG trusted setup from raw `trusted_setup.txt` bytes in native c-kzg-4844.
 */
export declare function loadTrustedSetupBytes(bytes: Uint8Array): void;
/**
 * Load KZG trusted setup in native c-kzg-4844 library.
 * Accepts raw `trusted_setup.txt` bytes, a file path on disk, or loads the
 * embedded native trusted setup when omitted.
 */
export declare function loadTrustedSetup(filePathOrBytes?: string | Uint8Array): void;
/**
 * Free KZG trusted setup resources in native c-kzg-4844 library.
 */
export declare function freeTrustedSetup(): void;
/**
 * Check whether native KZG trusted setup has been loaded.
 */
export declare function isInitialized(): boolean;
/**
 * Compute 48-byte KZG commitment for a 131072-byte EIP-4844 blob via native FFI.
 */
export declare function blobToKzgCommitment(blob: Uint8Array): Uint8Array;
/**
 * Compute KZG proof and evaluation y at point z for a blob via native FFI.
 */
export declare function computeKzgProof(blob: Uint8Array, z: Uint8Array): {
    proof: Uint8Array;
    y: Uint8Array;
};
/**
 * Compute blob KZG proof given blob and 48-byte commitment via native FFI.
 */
export declare function computeBlobKzgProof(blob: Uint8Array, commitment: Uint8Array): Uint8Array;
/**
 * Verify a KZG proof at point z with claimed value y via native FFI.
 */
export declare function verifyKzgProof(commitment: Uint8Array, z: Uint8Array, y: Uint8Array, proof: Uint8Array): boolean;
/**
 * Verify a blob KZG proof via native FFI.
 */
export declare function verifyBlobKzgProof(blob: Uint8Array, commitment: Uint8Array, proof: Uint8Array): boolean;
/**
 * Verify a batch of blob KZG proofs via native FFI.
 */
export declare function verifyBlobKzgProofBatch(blobs: Uint8Array[], commitments: Uint8Array[], proofs: Uint8Array[]): boolean;
/**
 * Native KZG namespace matching pure JS KZG 1:1.
 */
export declare function KZG(): never;
export declare namespace KZG {
    var loadTrustedSetup: typeof import("./KZG.native.js").loadTrustedSetup;
    var loadTrustedSetupBytes: typeof import("./KZG.native.js").loadTrustedSetupBytes;
    var freeTrustedSetup: typeof import("./KZG.native.js").freeTrustedSetup;
    var isInitialized: typeof import("./KZG.native.js").isInitialized;
    var validateBlob: typeof import("../../crypto/KZG/validateBlob.js").validateBlob;
    var createEmptyBlob: typeof import("../../crypto/KZG/createEmptyBlob.js").createEmptyBlob;
    var generateRandomBlob: typeof import("../../crypto/KZG/generateRandomBlob.js").generateRandomBlob;
    var blobToKzgCommitment: typeof import("./KZG.native.js").blobToKzgCommitment;
    var computeKzgProof: typeof import("./KZG.native.js").computeKzgProof;
    var computeBlobKzgProof: typeof import("./KZG.native.js").computeBlobKzgProof;
    var verifyKzgProof: typeof import("./KZG.native.js").verifyKzgProof;
    var verifyBlobKzgProof: typeof import("./KZG.native.js").verifyBlobKzgProof;
    var verifyBlobKzgProofBatch: typeof import("./KZG.native.js").verifyBlobKzgProofBatch;
    var computeCells: (blob: Uint8Array) => Uint8Array[];
    var computeCellsAndKzgProofs: (blob: Uint8Array) => {
        cells: Uint8Array[];
        proofs: Uint8Array[];
    };
    var verifyCellKzgProofBatch: (commitments: Uint8Array[], cellIndices: number[], cells: Uint8Array[], proofs: Uint8Array[]) => boolean;
    var recoverCellsAndKzgProofs: (cellIndices: number[], cells: Uint8Array[]) => {
        cells: Uint8Array[];
        proofs: Uint8Array[];
    };
    var Commitment: typeof import("./KZG.native.js").blobToKzgCommitment;
    var Proof: typeof import("./KZG.native.js").computeKzgProof;
    var BlobProof: typeof import("./KZG.native.js").computeBlobKzgProof;
}
export { BYTES_PER_BLOB, createEmptyBlob, generateRandomBlob, validateBlob };
//# sourceMappingURL=KZG.native.d.ts.map