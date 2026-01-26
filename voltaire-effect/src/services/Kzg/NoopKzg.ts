/**
 * @fileoverview No-op KZG implementation that always fails.
 *
 * @module NoopKzg
 * @since 0.0.1
 *
 * @description
 * Provides a stub KZG implementation for environments where KZG
 * operations are not available or not needed. All methods fail with
 * an appropriate error message.
 *
 * Use this layer when:
 * - Running in environments without KZG support (some WASM runtimes)
 * - Testing code that doesn't actually need KZG operations
 * - Building applications that don't use blob transactions
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { KzgError, KzgService } from "./KzgService.js";

/**
 * No-op KZG service that always fails.
 *
 * @description
 * All methods return Effect.fail with a KzgError indicating that
 * KZG is not available. Useful for environments that don't support
 * KZG or applications that don't use blob transactions.
 *
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import { Effect } from 'effect'
 * import { KzgService, NoopKzg } from 'voltaire-effect/services'
 *
 * // Use NoopKzg when KZG operations are not needed
 * const program = Effect.gen(function* () {
 *   const kzg = yield* KzgService
 *   // This will fail with "KZG not available"
 *   const commitment = yield* kzg.blobToCommitment(blobData)
 *   return commitment
 * }).pipe(Effect.provide(NoopKzg))
 * ```
 */
export const NoopKzg = Layer.succeed(KzgService, {
	blobToCommitment: (_blob: Uint8Array) =>
		Effect.fail(
			new KzgError({
				operation: "blobToCommitment",
				message: "KZG not available. Use DefaultKzg layer for KZG operations.",
			}),
		),

	computeProof: (_blob: Uint8Array, _commitment: Uint8Array) =>
		Effect.fail(
			new KzgError({
				operation: "computeProof",
				message: "KZG not available. Use DefaultKzg layer for KZG operations.",
			}),
		),

	verifyProof: (
		_commitment: Uint8Array,
		_z: Uint8Array,
		_y: Uint8Array,
		_proof: Uint8Array,
	) =>
		Effect.fail(
			new KzgError({
				operation: "verifyProof",
				message: "KZG not available. Use DefaultKzg layer for KZG operations.",
			}),
		),
});
