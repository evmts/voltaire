/**
 * @fileoverview Creates Signature from tuple format with Effect error handling.
 * @module Signature/fromTuple
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from tuple format [yParity, r, s].
 *
 * @param tuple - Tuple of [yParity (0 or 1), r (32 bytes), s (32 bytes)]
 * @param chainId - Optional chain ID for v value calculation
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromTuple([0, r, s]))
 * ```
 *
 * @since 0.0.1
 */
export const fromTuple = (
	tuple: [number, Uint8Array, Uint8Array],
	chainId?: number,
): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromTuple(tuple, chainId),
		catch: (e) => e as Error,
	});
