/**
 * @fileoverview Effect Schema for EIP-2098 compact signature format.
 * Provides bidirectional transformation between compact bytes and SignatureType.
 *
 * @module Compact
 * @since 0.1.0
 */

import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema declaration for SignatureType.
 * Validates that a value is a Uint8Array with algorithm property.
 *
 * @internal
 */
const SignatureTypeSchema = S.declare<SignatureType>(
	(u): u is SignatureType => {
		if (!(u instanceof Uint8Array)) return false;
		const val = u as unknown as Record<string, unknown>;
		return (
			"algorithm" in val &&
			(val.algorithm === "secp256k1" ||
				val.algorithm === "p256" ||
				val.algorithm === "ed25519")
		);
	},
	{ identifier: "Signature" },
);

/**
 * Schema for Signature in EIP-2098 compact format.
 *
 * @description
 * Transforms compact signature bytes (64 bytes with yParity in bit 255 of s)
 * to SignatureType and vice versa.
 *
 * EIP-2098 encodes the recovery bit in the highest bit of s, allowing
 * 64-byte signatures instead of 65-byte ones.
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const compactBytes = new Uint8Array(64) // EIP-2098 compact format
 * const sig = S.decodeSync(Signature.Compact)(compactBytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const compact = S.encodeSync(Signature.Compact)(sig)
 * // Uint8Array(64) with yParity encoded in bit 255 of s
 * ```
 *
 * @since 0.1.0
 */
export const Compact: S.Schema<SignatureType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	SignatureTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Signature.fromCompact(bytes, "secp256k1"));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (sig, _options, _ast) => {
			return ParseResult.succeed(Signature.toCompact(sig));
		},
	},
).annotations({ identifier: "Signature.Compact" });
