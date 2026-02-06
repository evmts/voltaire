/**
 * @fileoverview KZG commitment service definition for EIP-4844 blob transactions.
 *
 * @module KzgService
 * @since 0.0.1
 *
 * @description
 * The KzgService provides KZG polynomial commitment operations for Ethereum
 * blob transactions (EIP-4844). These operations are essential for creating
 * and verifying blob commitments in type-3 (blob) transactions.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 */

import * as Context from "effect/Context";
import * as Data from "effect/Data";
import type * as Effect from "effect/Effect";

/**
 * Error thrown when a KZG operation fails.
 *
 * @description
 * Contains the operation that failed, error message, and optional cause.
 *
 * Common failure reasons:
 * - KZG trusted setup not initialized
 * - Invalid blob size (must be 131072 bytes)
 * - Invalid commitment or proof format
 * - Verification failure
 *
 * @since 0.0.1
 */
export class KzgError extends Data.TaggedError("KzgError")<{
	/** The KZG operation that failed */
	readonly operation: "blobToCommitment" | "computeProof" | "verifyProof";
	/** Human-readable error message */
	readonly message: string;
	/** Underlying error that caused this failure */
	readonly cause?: unknown;
}> {}

/**
 * Shape of the KZG service.
 *
 * @description
 * Defines all KZG commitment operations available through KzgService.
 * Each method returns an Effect that may fail with KzgError.
 *
 * @since 0.0.1
 */
export type KzgShape = {
	/**
	 * Converts a blob to a KZG commitment.
	 * @param blob - The blob data (must be 131072 bytes)
	 * @returns The KZG commitment (48 bytes)
	 */
	readonly blobToCommitment: (
		blob: Uint8Array,
	) => Effect.Effect<Uint8Array, KzgError>;

	/**
	 * Computes a KZG proof for a blob given its commitment.
	 * @param blob - The blob data (must be 131072 bytes)
	 * @param commitment - The KZG commitment (48 bytes)
	 * @returns The KZG proof (48 bytes)
	 */
	readonly computeProof: (
		blob: Uint8Array,
		commitment: Uint8Array,
	) => Effect.Effect<Uint8Array, KzgError>;

	/**
	 * Verifies a KZG proof.
	 * @param commitment - The KZG commitment (48 bytes)
	 * @param z - The evaluation point (32 bytes)
	 * @param y - The claimed evaluation (32 bytes)
	 * @param proof - The KZG proof (48 bytes)
	 * @returns True if the proof is valid, false otherwise
	 */
	readonly verifyProof: (
		commitment: Uint8Array,
		z: Uint8Array,
		y: Uint8Array,
		proof: Uint8Array,
	) => Effect.Effect<boolean, KzgError>;
};

/**
 * KZG commitment service for EIP-4844 blob transactions.
 *
 * @description
 * Provides methods for creating and verifying KZG polynomial commitments.
 * This is an Effect Context.Tag that must be provided with a concrete
 * implementation (DefaultKzg or NoopKzg layer) before running.
 *
 * The service provides:
 * - blobToCommitment - Convert blob to 48-byte commitment
 * - computeProof - Compute KZG proof for blob
 * - verifyProof - Verify a KZG proof
 *
 * @since 0.0.1
 *
 * @see {@link DefaultKzg} - Live implementation using @tevm/voltaire/Kzg
 * @see {@link NoopKzg} - Stub implementation that always fails
 * @see {@link KzgShape} - The service interface shape
 * @see {@link KzgError} - Error type for failed operations
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { KzgService, DefaultKzg } from 'voltaire-effect'
 *
 * const program = Effect.gen(function* () {
 *   const kzg = yield* KzgService
 *   const commitment = yield* kzg.blobToCommitment(blobData)
 *   return commitment
 * }).pipe(Effect.provide(DefaultKzg))
 * ```
 */
export class KzgService extends Context.Tag("KzgService")<
	KzgService,
	KzgShape
>() {}
