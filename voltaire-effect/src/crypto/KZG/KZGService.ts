/**
 * @fileoverview KZGService Effect service definition for KZG polynomial commitments.
 * @module KZG/KZGService
 * @since 0.0.1
 */
import type {
	KzgBlobType,
	KzgCommitmentType,
	KzgProofType,
} from "@tevm/voltaire";
import { KZG } from "@tevm/voltaire";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

/**
 * Error thrown when a KZG operation fails.
 *
 * @description
 * Contains the operation that failed, error code, message, and optional cause.
 *
 * Common failure reasons:
 * - Trusted setup not loaded (SETUP_NOT_LOADED)
 * - Invalid blob size or format (INVALID_BLOB)
 * - Invalid commitment format (INVALID_COMMITMENT)
 * - Invalid proof format (INVALID_PROOF)
 * - Verification failure
 *
 * @since 0.0.1
 */
export class KZGError extends Data.TaggedError("KZGError")<{
	/** Error code for programmatic handling */
	readonly code:
		| "SETUP_NOT_LOADED"
		| "INVALID_BLOB"
		| "INVALID_COMMITMENT"
		| "INVALID_PROOF"
		| "OPERATION_FAILED";
	/** The KZG operation that failed */
	readonly operation:
		| "blobToKzgCommitment"
		| "computeBlobKzgProof"
		| "verifyBlobKzgProof"
		| "loadTrustedSetup"
		| "isInitialized";
	/** Human-readable error message */
	readonly message: string;
	/** Underlying error that caused this failure */
	readonly cause?: unknown;
}> {}

/**
 * Shape interface for KZG commitment service operations.
 *
 * @description
 * Defines the contract for KZG implementations. Operations require the trusted
 * setup to be loaded first via loadTrustedSetup().
 *
 * @since 0.0.1
 */
export interface KZGServiceShape {
	/**
	 * Computes a KZG commitment for a blob.
	 * @param blob - The 128KB blob data
	 * @returns Effect containing the 48-byte commitment, or KZGError if operation fails
	 */
	readonly blobToKzgCommitment: (
		blob: KzgBlobType,
	) => Effect.Effect<KzgCommitmentType, KZGError>;

	/**
	 * Computes a KZG proof for a blob and commitment.
	 * @param blob - The 128KB blob data
	 * @param commitment - The 48-byte commitment
	 * @returns Effect containing the 48-byte proof, or KZGError if operation fails
	 */
	readonly computeBlobKzgProof: (
		blob: KzgBlobType,
		commitment: KzgCommitmentType,
	) => Effect.Effect<KzgProofType, KZGError>;

	/**
	 * Verifies a KZG proof against a blob and commitment.
	 * @param blob - The 128KB blob data
	 * @param commitment - The 48-byte commitment
	 * @param proof - The 48-byte proof
	 * @returns Effect containing true if proof is valid, or KZGError if operation fails
	 */
	readonly verifyBlobKzgProof: (
		blob: KzgBlobType,
		commitment: KzgCommitmentType,
		proof: KzgProofType,
	) => Effect.Effect<boolean, KZGError>;

	/**
	 * Loads the trusted setup for KZG operations.
	 * @returns Effect that completes when setup is loaded, or KZGError if loading fails
	 */
	readonly loadTrustedSetup: () => Effect.Effect<void, KZGError>;

	/**
	 * Checks if the trusted setup has been initialized.
	 * @returns Effect containing true if initialized, or KZGError if check fails
	 */
	readonly isInitialized: () => Effect.Effect<boolean, KZGError>;
}

/**
 * KZG polynomial commitment service for Effect-based applications.
 * Implements EIP-4844 blob commitments for Ethereum proto-danksharding.
 *
 * @example
 * ```typescript
 * import { KZGService, KZGLive } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const kzg = yield* KZGService
 *   yield* kzg.loadTrustedSetup()
 *   const commitment = yield* kzg.blobToKzgCommitment(blob)
 *   const proof = yield* kzg.computeBlobKzgProof(blob, commitment)
 *   return yield* kzg.verifyBlobKzgProof(blob, commitment, proof)
 * }).pipe(Effect.provide(KZGLive))
 * ```
 * @since 0.0.1
 */
export class KZGService extends Context.Tag("KZGService")<
	KZGService,
	KZGServiceShape
>() {}

/**
 * Production layer for KZGService using native KZG implementation.
 *
 * @description
 * Provides real KZG operations using the c-kzg-4844 library with Ethereum's
 * trusted setup. The trusted setup must be loaded before other operations.
 *
 * @example
 * ```typescript
 * import { KZGService, KZGLive } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const kzg = yield* KZGService
 *   yield* kzg.loadTrustedSetup()
 *   const commitment = yield* kzg.blobToKzgCommitment(blob)
 *   return commitment
 * }).pipe(Effect.provide(KZGLive))
 * ```
 *
 * @since 0.0.1
 * @see {@link KZGTest} for unit testing
 */
export const KZGLive = Layer.succeed(KZGService, {
	blobToKzgCommitment: (blob) =>
		Effect.try({
			try: () => KZG.blobToKzgCommitment(blob) as KzgCommitmentType,
			catch: (e) =>
				new KZGError({
					code: "INVALID_BLOB",
					operation: "blobToKzgCommitment",
					message: `Failed to compute KZG commitment: ${e}`,
					cause: e,
				}),
		}),
	computeBlobKzgProof: (blob, commitment) =>
		Effect.try({
			try: () => KZG.computeBlobKzgProof(blob, commitment) as KzgProofType,
			catch: (e) =>
				new KZGError({
					code: "OPERATION_FAILED",
					operation: "computeBlobKzgProof",
					message: `Failed to compute KZG proof: ${e}`,
					cause: e,
				}),
		}),
	verifyBlobKzgProof: (blob, commitment, proof) =>
		Effect.try({
			try: () => KZG.verifyBlobKzgProof(blob, commitment, proof),
			catch: (e) =>
				new KZGError({
					code: "OPERATION_FAILED",
					operation: "verifyBlobKzgProof",
					message: `Failed to verify KZG proof: ${e}`,
					cause: e,
				}),
		}),
	loadTrustedSetup: () =>
		Effect.try({
			try: () => KZG.loadTrustedSetup(),
			catch: (e) =>
				new KZGError({
					code: "SETUP_NOT_LOADED",
					operation: "loadTrustedSetup",
					message: `Failed to load trusted setup: ${e}`,
					cause: e,
				}),
		}),
	isInitialized: () =>
		Effect.try({
			try: () => KZG.isInitialized(),
			catch: (e) =>
				new KZGError({
					code: "OPERATION_FAILED",
					operation: "isInitialized",
					message: `Failed to check initialization status: ${e}`,
					cause: e,
				}),
		}),
});

/**
 * Test layer for KZGService returning deterministic mock values.
 *
 * @description
 * Provides mock implementations for unit testing. Returns zero-filled
 * arrays for commitments/proofs and always verifies as true.
 * Use when testing application logic without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { KZGService, KZGTest, blobToKzgCommitment } from 'voltaire-effect/crypto/KZG'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = blobToKzgCommitment(blob).pipe(Effect.provide(KZGTest))
 * // Returns Uint8Array(48) filled with zeros
 * ```
 *
 * @since 0.0.1
 */
export const KZGTest = Layer.succeed(KZGService, {
	blobToKzgCommitment: (_blob) =>
		Effect.sync(() => new Uint8Array(48) as KzgCommitmentType),
	computeBlobKzgProof: (_blob, _commitment) =>
		Effect.sync(() => new Uint8Array(48) as KzgProofType),
	verifyBlobKzgProof: (_blob, _commitment, _proof) => Effect.succeed(true),
	loadTrustedSetup: () => Effect.succeed(undefined),
	isInitialized: () => Effect.succeed(true),
});
