/**
 * Blob Types and Utilities for EIP-4844
 *
 * Complete blob encoding/decoding, KZG commitments, and versioned hashes.
 * All types namespaced under Blob for intuitive access.
 *
 * Reference: https://eips.ethereum.org/EIPS/eip-4844
 *
 * @example
 * ```typescript
 * import { Blob } from './blob.js';
 *
 * // Constants
 * Blob.SIZE; // 131072
 * Blob.MAX_PER_TRANSACTION; // 6
 *
 * // Create blob from data
 * const blob: Blob = Blob.fromData(data);
 * const extracted = Blob.toData(blob);
 *
 * // KZG operations with this: pattern
 * const commitment: Blob.Commitment = Blob.toCommitment.call(blob);
 * const proof: Blob.Proof = Blob.toProof.call(blob, commitment);
 * const hash: Blob.VersionedHash = Blob.toVersionedHash.call(commitment);
 * const data = Blob.toData.call(blob);
 * ```
 */

import { Sha256 } from "../crypto/sha256.js";

// ============================================================================
// Main Blob Namespace
// ============================================================================

export namespace Blob {
  // ==========================================================================
  // Constants
  // ==========================================================================

  /** Blob size in bytes (128 KB = 4096 field elements * 32 bytes) */
  export const SIZE = 131072;

  /** Number of field elements per blob */
  export const FIELD_ELEMENTS_PER_BLOB = 4096;

  /** Bytes per field element */
  export const BYTES_PER_FIELD_ELEMENT = 32;

  /** Maximum blobs per transaction */
  export const MAX_PER_TRANSACTION = 6;

  /** Blob commitment version byte for KZG */
  export const COMMITMENT_VERSION_KZG = 0x01;

  /** Blob gas per blob (2^17) */
  export const GAS_PER_BLOB = 131072;

  /** Target blob gas per block (3 blobs) */
  export const TARGET_GAS_PER_BLOCK = 393216;

  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * Blob data (exactly 131072 bytes)
   */
  export type Data = Uint8Array & { readonly __blob: unique symbol };

  /**
   * KZG commitment (48 bytes)
   */
  export type Commitment = Uint8Array & { readonly __commitment: unique symbol };

  /**
   * KZG proof (48 bytes)
   */
  export type Proof = Uint8Array & { readonly __proof: unique symbol };

  /**
   * Versioned hash (32 bytes) - commitment hash with version prefix
   */
  export type VersionedHash = Uint8Array & { readonly __versionedHash: unique symbol };

  // ==========================================================================
  // Data Encoding/Decoding
  // ==========================================================================

  /**
   * Create blob from arbitrary data (standard form)
   * Encodes data with length prefix + data + padding
   *
   * @param data - Data to encode (max ~131KB)
   * @returns Blob containing encoded data
   * @throws If data exceeds maximum size
   *
   * @example
   * ```typescript
   * const data = new TextEncoder().encode("Hello, blob!");
   * const blob = Blob.fromData(data);
   * ```
   */
  export function fromData(data: Uint8Array): Blob.Data {
    if (data.length > SIZE - 8) {
      throw new Error(`Data too large: ${data.length} bytes (max ${SIZE - 8})`);
    }

    const blob = new Uint8Array(SIZE);
    const view = new DataView(blob.buffer);

    // Length prefix (8 bytes, little-endian)
    view.setBigUint64(0, BigInt(data.length), true);

    // Copy data
    blob.set(data, 8);

    return blob as Blob.Data;
  }

  /**
   * Extract data from blob
   * Decodes blob format (reads length prefix and extracts data)
   *
   * @returns Original data
   * @throws If blob size or length prefix is invalid
   *
   * @example
   * ```typescript
   * const data = Blob.toData.call(blob);
   * const text = new TextDecoder().decode(data);
   * ```
   */
  export function toData(this: Blob.Data): Uint8Array {
    if (this.length !== SIZE) {
      throw new Error(`Invalid blob size: ${this.length} (expected ${SIZE})`);
    }

    const view = new DataView(this.buffer, this.byteOffset, this.byteLength);
    const length = Number(view.getBigUint64(0, true));

    if (length > SIZE - 8) {
      throw new Error(`Invalid length prefix: ${length}`);
    }

    return this.slice(8, 8 + length);
  }

  /**
   * Validate blob has correct size
   *
   * @param blob - Blob to validate
   * @returns true if blob is exactly SIZE bytes
   *
   * @example
   * ```typescript
   * if (!Blob.isValid(blob)) {
   *   throw new Error("Invalid blob");
   * }
   * ```
   */
  export function isValid(blob: Uint8Array): blob is Blob.Data {
    return blob.length === SIZE;
  }

  // ==========================================================================
  // KZG Operations
  // ==========================================================================

  /**
   * Compute KZG commitment for blob
   *
   * @returns 48-byte KZG commitment
   *
   * @example
   * ```typescript
   * const commitment = Blob.toCommitment.call(blob);
   * ```
   *
   * TODO: Implement using c-kzg-4844 library
   * - Load KZG trusted setup
   * - Call blobToKzgCommitment(blob)
   * - Return 48-byte commitment
   */
  export function toCommitment(this: Blob.Data): Blob.Commitment {
    if (this.length !== SIZE) {
      throw new Error(`Invalid blob size: ${this.length}`);
    }
    // TODO: const commitment = blobToKzgCommitment(this);
    // TODO: return commitment as Blob.Commitment;
    throw new Error("Not implemented: requires c-kzg-4844 library");
  }

  /**
   * Generate KZG proof for blob
   *
   * @param commitment - KZG commitment for the blob
   * @returns 48-byte KZG proof
   *
   * @example
   * ```typescript
   * const commitment = Blob.toCommitment.call(blob);
   * const proof = Blob.toProof.call(blob, commitment);
   * ```
   *
   * TODO: Implement using c-kzg-4844 library
   * - Call computeBlobKzgProof(blob, commitment)
   * - Return 48-byte proof
   */
  export function toProof(this: Blob.Data, commitment: Blob.Commitment): Blob.Proof {
    if (this.length !== SIZE) {
      throw new Error(`Invalid blob size: ${this.length}`);
    }
    if (commitment.length !== 48) {
      throw new Error(`Invalid commitment size: ${commitment.length}`);
    }
    // TODO: const proof = computeBlobKzgProof(this, commitment);
    // TODO: return proof as Blob.Proof;
    throw new Error("Not implemented: requires c-kzg-4844 library");
  }

  /**
   * Verify KZG proof
   *
   * @param commitment - KZG commitment
   * @param proof - KZG proof
   * @returns true if proof is valid
   *
   * @example
   * ```typescript
   * const isValid = Blob.verify.call(blob, commitment, proof);
   * ```
   *
   * TODO: Implement using c-kzg-4844 library
   * - Call verifyBlobKzgProof(blob, commitment, proof)
   * - Return boolean result
   */
  export function verify(
    this: Blob.Data,
    commitment: Blob.Commitment,
    proof: Blob.Proof,
  ): boolean {
    if (this.length !== SIZE) {
      throw new Error(`Invalid blob size: ${this.length}`);
    }
    if (commitment.length !== 48) {
      throw new Error(`Invalid commitment size: ${commitment.length}`);
    }
    if (proof.length !== 48) {
      throw new Error(`Invalid proof size: ${proof.length}`);
    }
    // TODO: return verifyBlobKzgProof(this, commitment, proof);
    throw new Error("Not implemented: requires c-kzg-4844 library");
  }

  /**
   * Verify multiple blob proofs in batch (standard form)
   *
   * @param blobs - Array of blobs
   * @param commitments - Array of commitments
   * @param proofs - Array of proofs
   * @returns true if all proofs are valid
   *
   * @example
   * ```typescript
   * const isValid = Blob.verifyBatch(blobs, commitments, proofs);
   * ```
   *
   * TODO: Implement using c-kzg-4844 library
   * - Validate arrays have same length
   * - Call verifyBlobKzgProofBatch(blobs, commitments, proofs)
   * - Return boolean result
   */
  export function verifyBatch(
    blobs: readonly Blob.Data[],
    commitments: readonly Blob.Commitment[],
    proofs: readonly Blob.Proof[],
  ): boolean {
    if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
      throw new Error("Arrays must have same length");
    }
    if (blobs.length > MAX_PER_TRANSACTION) {
      throw new Error(`Too many blobs: ${blobs.length} (max ${MAX_PER_TRANSACTION})`);
    }
    // TODO: return verifyBlobKzgProofBatch(blobs, commitments, proofs);
    throw new Error("Not implemented: requires c-kzg-4844 library");
  }

  // ==========================================================================
  // Versioned Hash Operations
  // ==========================================================================

  /**
   * Create versioned hash from commitment
   * Formula: BLOB_COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
   *
   * @returns 32-byte versioned hash
   *
   * @example
   * ```typescript
   * const hash = await Blob.toVersionedHash.call(commitment);
   * ```
   *
   * TODO: Implement SHA-256 hashing
   * - Hash commitment with SHA-256
   * - Prepend version byte
   * - Take first 32 bytes
   */
  export function toVersionedHash(this: Blob.Commitment): Blob.VersionedHash {
    if (this.length !== 48) {
      throw new Error(`Invalid commitment size: ${this.length}`);
    }

    // Hash the commitment with SHA-256
    const hash = Sha256.hash(this);

    // Create versioned hash: version byte + hash[1:32]
    const versionedHash = new Uint8Array(32);
    versionedHash[0] = COMMITMENT_VERSION_KZG;
    versionedHash.set(hash.slice(1), 1);

    return versionedHash as Blob.VersionedHash;
  }

  /**
   * Validate versioned hash
   *
   * @returns true if version byte is correct
   *
   * @example
   * ```typescript
   * if (!Blob.isValidVersion.call(hash)) {
   *   throw new Error("Invalid version");
   * }
   * ```
   */
  export function isValidVersion(this: Blob.VersionedHash): boolean {
    return this.length === 32 && this[0] === COMMITMENT_VERSION_KZG;
  }

  // ==========================================================================
  // Commitment Operations (nested namespace)
  // ==========================================================================

  export namespace Commitment {
    /**
     * Validate commitment has correct size
     *
     * @param commitment - Commitment to validate
     * @returns true if commitment is 48 bytes
     */
    export function isValid(commitment: Uint8Array): commitment is Blob.Commitment {
      return commitment.length === 48;
    }

    /**
     * Create versioned hash from commitment
     *
     * @returns Versioned hash
     */
    export function toVersionedHash(this: Blob.Commitment): Blob.VersionedHash {
      return Blob.toVersionedHash.call(this);
    }
  }

  // ==========================================================================
  // Proof Operations (nested namespace)
  // ==========================================================================

  export namespace Proof {
    /**
     * Validate proof has correct size
     *
     * @param proof - Proof to validate
     * @returns true if proof is 48 bytes
     */
    export function isValid(proof: Uint8Array): proof is Blob.Proof {
      return proof.length === 48;
    }
  }

  // ==========================================================================
  // VersionedHash Operations (nested namespace)
  // ==========================================================================

  export namespace VersionedHash {
    /**
     * Validate versioned hash
     *
     * @param hash - Hash to validate
     * @returns true if hash is 32 bytes with correct version
     */
    export function isValid(hash: Uint8Array): hash is Blob.VersionedHash {
      return hash.length === 32 && hash[0] === COMMITMENT_VERSION_KZG;
    }

    /**
     * Get version byte from hash
     *
     * @param hash - Versioned hash
     * @returns Version byte
     */
    export function getVersion(hash: Blob.VersionedHash): number {
      return hash[0];
    }

    /**
     * Get version byte (convenience form with this:)
     *
     * @returns Version byte
     */
    export function version(this: Blob.VersionedHash): number {
      return getVersion(this);
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Calculate blob gas for number of blobs
   *
   * @param blobCount - Number of blobs
   * @returns Total blob gas
   *
   * @example
   * ```typescript
   * const gas = Blob.calculateGas(3); // 393216
   * ```
   */
  export function calculateGas(blobCount: number): number {
    if (blobCount < 0 || blobCount > MAX_PER_TRANSACTION) {
      throw new Error(`Invalid blob count: ${blobCount} (max ${MAX_PER_TRANSACTION})`);
    }
    return blobCount * GAS_PER_BLOB;
  }

  /**
   * Estimate number of blobs needed for data
   *
   * @param dataSize - Size of data in bytes
   * @returns Number of blobs required
   *
   * @example
   * ```typescript
   * const blobCount = Blob.estimateBlobCount(200000); // 2
   * ```
   */
  export function estimateBlobCount(dataSize: number): number {
    if (dataSize < 0) {
      throw new Error(`Invalid data size: ${dataSize}`);
    }
    const maxDataPerBlob = SIZE - 8; // Account for length prefix
    return Math.ceil(dataSize / maxDataPerBlob);
  }

  /**
   * Split large data into multiple blobs
   *
   * @param data - Data to split
   * @returns Array of blobs containing the data
   *
   * @example
   * ```typescript
   * const largeData = new Uint8Array(300000);
   * const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]
   * ```
   */
  export function splitData(data: Uint8Array): Blob.Data[] {
    const maxDataPerBlob = SIZE - 8;
    const blobCount = estimateBlobCount(data.length);

    if (blobCount > MAX_PER_TRANSACTION) {
      throw new Error(
        `Data too large: requires ${blobCount} blobs (max ${MAX_PER_TRANSACTION})`,
      );
    }

    const blobs: Blob.Data[] = [];
    for (let i = 0; i < blobCount; i++) {
      const start = i * maxDataPerBlob;
      const end = Math.min(start + maxDataPerBlob, data.length);
      const chunk = data.slice(start, end);
      blobs.push(fromData(chunk));
    }

    return blobs;
  }

  /**
   * Join multiple blobs into single data buffer
   *
   * @param blobs - Array of blobs to join
   * @returns Combined data
   *
   * @example
   * ```typescript
   * const blobs = Blob.splitData(largeData);
   * const reconstructed = Blob.joinData(blobs);
   * ```
   */
  export function joinData(blobs: readonly Blob.Data[]): Uint8Array {
    const chunks = blobs.map(b => toData.call(b));
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}

/**
 * Complete Blob type (Uint8Array of SIZE bytes)
 *
 * Uses TypeScript declaration merging - Blob is both a namespace and a type.
 */
export type Blob = Blob.Data;

// Re-export namespace as default
export default Blob;
