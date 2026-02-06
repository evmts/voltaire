/**
 * @fileoverview Creates Signature from bytes with Effect error handling.
 * @module Signature/fromBytes
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from raw bytes.
 *
 * @param bytes - 64 or 65 byte array (r + s, optionally + v)
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromBytes(new Uint8Array(65)))
 * ```
 *
 * @since 0.0.1
 */
export const fromBytes = (
	bytes: Uint8Array,
): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromBytes(bytes),
		catch: (e) => e as Error,
	});
