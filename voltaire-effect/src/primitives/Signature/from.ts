/**
 * @fileoverview Creates Signature from various inputs with Effect error handling.
 * @module Signature/from
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from various input formats.
 *
 * @param value - Input value (bytes or signature object with r, s, v)
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.from(signatureBytes))
 * ```
 *
 * @since 0.0.1
 */
export const from = (
	value:
		| Uint8Array
		| {
				r: Uint8Array;
				s: Uint8Array;
				v?: number;
				algorithm?: "secp256k1" | "p256" | "ed25519";
		  },
): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.from(value),
		catch: (e) => e as Error,
	});
