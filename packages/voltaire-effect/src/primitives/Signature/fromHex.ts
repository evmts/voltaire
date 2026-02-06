/**
 * @fileoverview Creates Signature from hex string with Effect error handling.
 * @module Signature/fromHex
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from a hex string.
 *
 * @param hex - Hex string (64 or 65 bytes with 0x prefix)
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromHex('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b'))
 * ```
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromHex(hex),
		catch: (e) => e as Error,
	});
