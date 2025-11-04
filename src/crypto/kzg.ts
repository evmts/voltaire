/**
 * KZG Commitments for EIP-4844
 *
 * TypeScript bindings for c-kzg-4844 library operations.
 * All operations namespaced under Kzg for intuitive access.
 *
 * @example
 * ```typescript
 * import { Kzg } from './kzg.js';
 *
 * // Initialize trusted setup (required once)
 * await Kzg.loadTrustedSetup();
 *
 * // Generate commitment from blob
 * const commitment = Kzg.blobToKzgCommitment(blob);
 *
 * // Compute proof at evaluation point
 * const { proof, y } = Kzg.computeKzgProof(blob, z);
 *
 * // Verify proof
 * const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
 * ```
 */

import * as ckzg from "c-kzg";

// ============================================================================
// Error Types
// ============================================================================

export class KzgError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgError";
	}
}

export class KzgNotInitializedError extends Error {
	constructor(message = "KZG trusted setup not initialized") {
		super(message);
		this.name = "KzgNotInitializedError";
	}
}

export class KzgInvalidBlobError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgInvalidBlobError";
	}
}

export class KzgVerificationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "KzgVerificationError";
	}
}

// ============================================================================
// Constants (EIP-4844)
// ============================================================================

/** Bytes per blob (128 KB) */
export const BYTES_PER_BLOB = 131072;

/** Bytes per KZG commitment (48 bytes, BLS12-381 G1 point) */
export const BYTES_PER_COMMITMENT = 48;

/** Bytes per KZG proof (48 bytes, BLS12-381 G1 point) */
export const BYTES_PER_PROOF = 48;

/** Bytes per field element (32 bytes) */
export const BYTES_PER_FIELD_ELEMENT = 32;

/** Field elements per blob (4096) */
export const FIELD_ELEMENTS_PER_BLOB = 4096;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Blob data (131072 bytes)
 */
export type Blob = Uint8Array;

/**
 * KZG commitment (48 bytes, BLS12-381 G1 point)
 */
export type KzgCommitment = Uint8Array;

/**
 * KZG proof (48 bytes, BLS12-381 G1 point)
 */
export type KzgProof = Uint8Array;

/**
 * Field element (32 bytes)
 */
export type Bytes32 = Uint8Array;

/**
 * Proof computation result
 */
export interface ProofResult {
	proof: KzgProof;
	y: Bytes32;
}

// ============================================================================
// Main Kzg Namespace
// ============================================================================

export namespace Kzg {
	// Track initialization state
	let initialized = false;

	/**
	 * Check if KZG is initialized
	 *
	 * @returns true if trusted setup is loaded
	 *
	 * @example
	 * ```typescript
	 * if (!Kzg.isInitialized()) {
	 *   await Kzg.loadTrustedSetup();
	 * }
	 * ```
	 */
	export function isInitialized(): boolean {
		return initialized;
	}

	/**
	 * Load trusted setup from embedded data or file
	 *
	 * Uses embedded trusted setup from c-kzg by default.
	 * Call this once during application startup.
	 *
	 * @param filePath - Optional path to trusted setup file
	 * @throws {KzgError} If loading fails
	 *
	 * @example
	 * ```typescript
	 * // Use embedded setup (recommended)
	 * await Kzg.loadTrustedSetup();
	 *
	 * // Or load from file
	 * await Kzg.loadTrustedSetup('./trusted_setup.txt');
	 * ```
	 */
	export function loadTrustedSetup(filePath?: string): void {
		try {
			// c-kzg doesn't allow reloading, so skip if already initialized
			if (initialized) {
				return;
			}
			if (filePath) {
				// Load from file if path provided
				// c-kzg expects loadTrustedSetup(precompute: number, filePath: string)
				ckzg.loadTrustedSetup(0, filePath);
			} else {
				// Use embedded trusted setup (c-kzg uses DEFAULT_TRUSTED_SETUP_PATH)
				// Just pass precompute=0 to use default embedded setup
				ckzg.loadTrustedSetup(0);
			}
			initialized = true;
		} catch (error) {
			// If already loaded by c-kzg, just mark as initialized
			if (error instanceof Error && error.message.includes("already loaded")) {
				initialized = true;
				return;
			}
			throw new KzgError(
				`Failed to load trusted setup: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Free trusted setup resources
	 *
	 * Note: c-kzg v4+ does not provide a freeTrustedSetup function.
	 * The trusted setup persists for the lifetime of the process.
	 * This function is provided for API compatibility and only resets
	 * the initialized flag.
	 *
	 * @example
	 * ```typescript
	 * // Reset initialization state
	 * Kzg.freeTrustedSetup();
	 * ```
	 */
	export function freeTrustedSetup(): void {
		// c-kzg v4+ doesn't have freeTrustedSetup function
		// Just reset our tracking flag for testing purposes
		initialized = false;
	}

	/**
	 * Validate blob format
	 *
	 * @param blob - Blob to validate
	 * @throws {KzgInvalidBlobError} If blob is invalid
	 *
	 * @example
	 * ```typescript
	 * Kzg.validateBlob(blob); // throws if invalid
	 * ```
	 */
	export function validateBlob(blob: Blob): void {
		if (!(blob instanceof Uint8Array)) {
			throw new KzgInvalidBlobError("Blob must be Uint8Array");
		}
		if (blob.length !== BYTES_PER_BLOB) {
			throw new KzgInvalidBlobError(
				`Blob must be ${BYTES_PER_BLOB} bytes, got ${blob.length}`,
			);
		}
		// Validate that each field element has top byte = 0
		for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
			const offset = i * BYTES_PER_FIELD_ELEMENT;
			if (blob[offset] !== 0) {
				throw new KzgInvalidBlobError(
					`Invalid field element at index ${i}: top byte must be 0`,
				);
			}
		}
	}

	/**
	 * Convert blob to KZG commitment
	 *
	 * Computes polynomial commitment to blob data using KZG scheme.
	 *
	 * @param blob - Blob data (131072 bytes)
	 * @returns KZG commitment (48 bytes)
	 * @throws {KzgNotInitializedError} If trusted setup not loaded
	 * @throws {KzgInvalidBlobError} If blob is invalid
	 * @throws {KzgError} If commitment computation fails
	 *
	 * @example
	 * ```typescript
	 * const blob = new Uint8Array(131072);
	 * const commitment = Kzg.blobToKzgCommitment(blob);
	 * ```
	 */
	export function blobToKzgCommitment(blob: Blob): KzgCommitment {
		if (!initialized) {
			throw new KzgNotInitializedError();
		}
		validateBlob(blob);
		try {
			return ckzg.blobToKzgCommitment(blob);
		} catch (error) {
			throw new KzgError(
				`Failed to compute commitment: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Compute KZG proof for blob at evaluation point z
	 *
	 * Generates proof that polynomial(z) = y.
	 *
	 * @param blob - Blob data (131072 bytes)
	 * @param z - Evaluation point (32 bytes)
	 * @returns Proof and evaluation result y
	 * @throws {KzgNotInitializedError} If trusted setup not loaded
	 * @throws {KzgInvalidBlobError} If blob is invalid
	 * @throws {KzgError} If proof computation fails
	 *
	 * @example
	 * ```typescript
	 * const blob = new Uint8Array(131072);
	 * const z = new Uint8Array(32);
	 * const { proof, y } = Kzg.computeKzgProof(blob, z);
	 * ```
	 */
	export function computeKzgProof(blob: Blob, z: Bytes32): ProofResult {
		if (!initialized) {
			throw new KzgNotInitializedError();
		}
		validateBlob(blob);
		if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
			throw new KzgError(
				`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`,
			);
		}
		try {
			const result = ckzg.computeKzgProof(blob, z);
			return {
				proof: result[0],
				y: result[1],
			};
		} catch (error) {
			throw new KzgError(
				`Failed to compute proof: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Verify KZG proof
	 *
	 * Verifies that commitment C corresponds to polynomial P where P(z) = y.
	 *
	 * @param commitment - KZG commitment (48 bytes)
	 * @param z - Evaluation point (32 bytes)
	 * @param y - Claimed evaluation result (32 bytes)
	 * @param proof - KZG proof (48 bytes)
	 * @returns true if proof is valid, false otherwise
	 * @throws {KzgNotInitializedError} If trusted setup not loaded
	 * @throws {KzgError} If verification fails due to invalid inputs
	 *
	 * @example
	 * ```typescript
	 * const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
	 * if (!valid) {
	 *   throw new Error('Invalid proof');
	 * }
	 * ```
	 */
	export function verifyKzgProof(
		commitment: KzgCommitment,
		z: Bytes32,
		y: Bytes32,
		proof: KzgProof,
	): boolean {
		if (!initialized) {
			throw new KzgNotInitializedError();
		}
		if (
			!(commitment instanceof Uint8Array) ||
			commitment.length !== BYTES_PER_COMMITMENT
		) {
			throw new KzgError(
				`Commitment must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
			);
		}
		if (!(z instanceof Uint8Array) || z.length !== BYTES_PER_FIELD_ELEMENT) {
			throw new KzgError(
				`Evaluation point must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${z instanceof Uint8Array ? z.length : "not Uint8Array"}`,
			);
		}
		if (!(y instanceof Uint8Array) || y.length !== BYTES_PER_FIELD_ELEMENT) {
			throw new KzgError(
				`Evaluation result must be ${BYTES_PER_FIELD_ELEMENT} bytes, got ${y instanceof Uint8Array ? y.length : "not Uint8Array"}`,
			);
		}
		if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
			throw new KzgError(
				`Proof must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
			);
		}
		try {
			return ckzg.verifyKzgProof(commitment, z, y, proof);
		} catch (error) {
			// If verification fails due to bad args/invalid proof, return false
			// rather than throwing (this is a verification failure, not an error)
			if (error instanceof Error && error.message.includes("C_KZG_BADARGS")) {
				return false;
			}
			throw new KzgError(
				`Failed to verify proof: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Verify blob KZG proof (optimized for blob verification)
	 *
	 * Efficient verification that commitment matches blob.
	 *
	 * @param blob - Blob data (131072 bytes)
	 * @param commitment - KZG commitment (48 bytes)
	 * @param proof - KZG proof (48 bytes)
	 * @returns true if proof is valid, false otherwise
	 * @throws {KzgNotInitializedError} If trusted setup not loaded
	 * @throws {KzgInvalidBlobError} If blob is invalid
	 * @throws {KzgError} If verification fails
	 *
	 * @example
	 * ```typescript
	 * const valid = Kzg.verifyBlobKzgProof(blob, commitment, proof);
	 * ```
	 */
	export function verifyBlobKzgProof(
		blob: Blob,
		commitment: KzgCommitment,
		proof: KzgProof,
	): boolean {
		if (!initialized) {
			throw new KzgNotInitializedError();
		}
		validateBlob(blob);
		if (
			!(commitment instanceof Uint8Array) ||
			commitment.length !== BYTES_PER_COMMITMENT
		) {
			throw new KzgError(
				`Commitment must be ${BYTES_PER_COMMITMENT} bytes, got ${commitment instanceof Uint8Array ? commitment.length : "not Uint8Array"}`,
			);
		}
		if (!(proof instanceof Uint8Array) || proof.length !== BYTES_PER_PROOF) {
			throw new KzgError(
				`Proof must be ${BYTES_PER_PROOF} bytes, got ${proof instanceof Uint8Array ? proof.length : "not Uint8Array"}`,
			);
		}
		try {
			return ckzg.verifyBlobKzgProof(blob, commitment, proof);
		} catch (error) {
			throw new KzgError(
				`Failed to verify blob proof: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Verify multiple blob KZG proofs (batch verification)
	 *
	 * More efficient than verifying proofs individually.
	 *
	 * @param blobs - Array of blobs
	 * @param commitments - Array of commitments
	 * @param proofs - Array of proofs
	 * @returns true if all proofs are valid, false otherwise
	 * @throws {KzgNotInitializedError} If trusted setup not loaded
	 * @throws {KzgError} If arrays have different lengths or verification fails
	 *
	 * @example
	 * ```typescript
	 * const valid = Kzg.verifyBlobKzgProofBatch(blobs, commitments, proofs);
	 * ```
	 */
	export function verifyBlobKzgProofBatch(
		blobs: Blob[],
		commitments: KzgCommitment[],
		proofs: KzgProof[],
	): boolean {
		if (!initialized) {
			throw new KzgNotInitializedError();
		}
		if (blobs.length !== commitments.length || blobs.length !== proofs.length) {
			throw new KzgError(
				"Blobs, commitments, and proofs arrays must have same length",
			);
		}
		for (const blob of blobs) {
			validateBlob(blob);
		}
		try {
			return ckzg.verifyBlobKzgProofBatch(blobs, commitments, proofs);
		} catch (error) {
			throw new KzgError(
				`Failed to verify batch: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// ==========================================================================
	// Utility Functions
	// ==========================================================================

	/**
	 * Create empty blob filled with zeros
	 *
	 * @returns New zero-filled blob
	 *
	 * @example
	 * ```typescript
	 * const blob = Kzg.createEmptyBlob();
	 * ```
	 */
	export function createEmptyBlob(): Blob {
		return new Uint8Array(BYTES_PER_BLOB);
	}

	/**
	 * Generate random valid blob (for testing)
	 *
	 * @param seed - Optional seed for deterministic generation
	 * @returns Random blob with valid field elements
	 *
	 * @example
	 * ```typescript
	 * const blob = Kzg.generateRandomBlob();
	 * ```
	 */
	export function generateRandomBlob(seed?: number): Blob {
		const blob = new Uint8Array(BYTES_PER_BLOB);
		if (seed !== undefined) {
			// Simple seeded PRNG
			let x = seed;
			for (let i = 0; i < blob.length; i++) {
				x = (x * 1103515245 + 12345) & 0x7fffffff;
				blob[i] = (x >>> 16) & 0xff;
			}
		} else {
			// Use crypto random in chunks (getRandomValues has 65536 byte limit)
			if (typeof crypto !== "undefined" && crypto.getRandomValues) {
				const chunkSize = 65536;
				for (let offset = 0; offset < blob.length; offset += chunkSize) {
					const end = Math.min(offset + chunkSize, blob.length);
					crypto.getRandomValues(blob.subarray(offset, end));
				}
			} else {
				throw new KzgError("crypto.getRandomValues not available");
			}
		}
		// Ensure each field element is valid by clearing top byte
		for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
			blob[i * BYTES_PER_FIELD_ELEMENT] = 0;
		}
		return blob;
	}
}

// Re-export namespace as default
export default Kzg;
