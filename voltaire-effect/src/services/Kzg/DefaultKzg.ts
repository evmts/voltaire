/**
 * @fileoverview Default KZG implementation using @tevm/voltaire/Kzg.
 *
 * @module DefaultKzg
 * @since 0.0.1
 *
 * @description
 * Provides the live KZG implementation layer using the native Zig/WASM
 * KZG bindings from @tevm/voltaire. Requires the trusted setup to be
 * initialized before use.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4844
 */

import {
	blobToKzgCommitment,
	computeBlobKzgProof,
	loadTrustedSetup,
	verifyKzgProof,
} from "@tevm/voltaire/KZG";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { KzgError, KzgService } from "./KzgService.js";

/**
 * Ensures the KZG trusted setup is loaded before performing operations.
 * This is idempotent - calling multiple times is safe.
 */
const ensureTrustedSetup = Effect.sync(() => {
	loadTrustedSetup();
});

/**
 * Default KZG service implementation using @tevm/voltaire/Kzg.
 *
 * @description
 * This layer provides KZG polynomial commitment operations using the
 * native Zig/WASM bindings. The trusted setup is automatically loaded
 * on first use.
 *
 * @since 0.0.1
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
export const DefaultKzg = Layer.sync(KzgService, () => ({
	blobToCommitment: (blob: Uint8Array) =>
		Effect.gen(function* () {
			yield* ensureTrustedSetup;
			return yield* Effect.try({
				try: () => blobToKzgCommitment(blob),
				catch: (error) =>
					new KzgError({
						operation: "blobToCommitment",
						message:
							error instanceof Error
								? error.message
								: "Failed to compute blob commitment",
						cause: error,
					}),
			});
		}),

	computeProof: (blob: Uint8Array, commitment: Uint8Array) =>
		Effect.gen(function* () {
			yield* ensureTrustedSetup;
			return yield* Effect.try({
				try: () => computeBlobKzgProof(blob, commitment),
				catch: (error) =>
					new KzgError({
						operation: "computeProof",
						message:
							error instanceof Error
								? error.message
								: "Failed to compute KZG proof",
						cause: error,
					}),
			});
		}),

	verifyProof: (
		commitment: Uint8Array,
		z: Uint8Array,
		y: Uint8Array,
		proof: Uint8Array,
	) =>
		Effect.gen(function* () {
			yield* ensureTrustedSetup;
			return yield* Effect.try({
				try: () => verifyKzgProof(commitment, z, y, proof),
				catch: (error) =>
					new KzgError({
						operation: "verifyProof",
						message:
							error instanceof Error
								? error.message
								: "Failed to verify KZG proof",
						cause: error,
					}),
			});
		}),
}));
