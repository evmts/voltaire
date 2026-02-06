/**
 * @fileoverview Creates Signature from EIP-2098 compact format with Effect error handling.
 * @module Signature/fromCompact
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from EIP-2098 compact format.
 *
 * @param bytes - 64-byte compact signature
 * @param algorithmOrV - Algorithm ('secp256k1' | 'p256') or explicit v value
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromCompact(compactBytes, 'secp256k1'))
 * ```
 *
 * @since 0.0.1
 */
export const fromCompact = (
	bytes: Uint8Array,
	algorithmOrV: "secp256k1" | "p256" | number = "secp256k1",
): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromCompact(bytes, algorithmOrV),
		catch: (e) => e as Error,
	});
