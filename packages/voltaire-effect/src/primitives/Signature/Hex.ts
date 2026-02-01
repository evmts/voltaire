/**
 * @fileoverview Effect Schema for Signature hex string encoding.
 * Provides bidirectional transformation between hex strings and SignatureType.
 *
 * @module Hex
 * @since 0.1.0
 */

import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { SignatureTypeSchema } from "./SignatureSchema.js";

/**
 * Schema for Signature encoded as a hex string.
 *
 * @description
 * Transforms hex strings to SignatureType and vice versa.
 * Accepts 64-byte (128 hex chars) or 65-byte (130 hex chars with recovery byte) signatures.
 * Encodes with v byte for secp256k1, without for other algorithms.
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const sig = S.decodeSync(Signature.Hex)('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Signature.Hex)(sig)
 * // "0x..." (130 hex chars with 0x prefix for secp256k1 with v)
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<SignatureType, string> = S.transformOrFail(
	S.String,
	SignatureTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Signature.fromHex(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (sig, _options, _ast) => {
			return ParseResult.succeed(Signature.toHex(sig));
		},
	},
).annotations({ identifier: "Signature.Hex" });
