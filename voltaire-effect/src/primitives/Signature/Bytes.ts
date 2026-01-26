/**
 * @fileoverview Effect Schema for creating Signatures from byte arrays.
 * Provides bidirectional transformation between Uint8Array and SignatureType.
 *
 * @module Bytes
 * @since 0.1.0
 */

import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { SignatureTypeSchema } from "./SignatureSchema.js";

/**
 * Schema for Signature encoded as bytes.
 *
 * @description
 * Transforms Uint8Array (64 or 65 bytes) to SignatureType and vice versa.
 * - 65 bytes: secp256k1 with recovery byte (r[32] + s[32] + v[1])
 * - 64 bytes: secp256k1/p256/ed25519 without recovery
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(64).fill(0xab)
 * const sig = S.decodeSync(Signature.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Signature.Bytes)(sig)
 * // Uint8Array(64) or Uint8Array(65)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<SignatureType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	SignatureTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Signature.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (sig, _options, _ast) => {
			return ParseResult.succeed(Signature.toBytes(sig));
		},
	},
).annotations({ identifier: "Signature.Bytes" });
