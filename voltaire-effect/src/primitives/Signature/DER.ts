/**
 * @fileoverview Effect Schema for DER-encoded ECDSA signatures.
 * Provides bidirectional transformation between DER bytes and SignatureType.
 *
 * @module DER
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
 * Schema for Signature in DER (Distinguished Encoding Rules) format.
 *
 * @description
 * Transforms DER-encoded ECDSA signature bytes to SignatureType and vice versa.
 * DER format is commonly used in TLS, X.509 certificates, and Bitcoin.
 *
 * Note: DER encoding is variable length (typically 70-72 bytes for secp256k1).
 * This schema defaults to secp256k1 algorithm for decoding.
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const derBytes = new Uint8Array([0x30, 0x44, ...]) // DER encoded
 * const sig = S.decodeSync(Signature.DER)(derBytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const der = S.encodeSync(Signature.DER)(sig)
 * // Uint8Array with DER encoding
 * ```
 *
 * @since 0.1.0
 */
export const DER: S.Schema<SignatureType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	SignatureTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Signature.fromDER(bytes, "secp256k1"));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (sig, _options, ast) => {
			try {
				return ParseResult.succeed(Signature.toDER(sig));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, sig, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "Signature.DER" });
