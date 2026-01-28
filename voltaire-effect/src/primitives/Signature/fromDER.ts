/**
 * @fileoverview Creates Signature from DER format with Effect error handling.
 * @module Signature/fromDER
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as Effect from "effect/Effect";

/**
 * Creates a Signature from DER-encoded bytes.
 *
 * @param bytes - DER-encoded signature
 * @param algorithm - Algorithm ('secp256k1' | 'p256')
 * @param v - Optional recovery value for secp256k1
 * @returns Effect that succeeds with SignatureType or fails with parse error
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import { Effect } from 'effect'
 *
 * const sig = Effect.runSync(Signature.fromDER(derBytes, 'secp256k1'))
 * ```
 *
 * @since 0.0.1
 */
export const fromDER = (
	bytes: Uint8Array,
	algorithm: "secp256k1" | "p256" = "secp256k1",
	v?: number,
): Effect.Effect<SignatureType, Error> =>
	Effect.try({
		try: () => Signature.fromDER(bytes, algorithm, v),
		catch: (e) => e as Error,
	});
