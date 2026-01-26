/**
 * @fileoverview Effect Schema for tuple-format signatures [yParity, r, s].
 * Provides bidirectional transformation between tuples and SignatureType.
 *
 * @module Tuple
 * @since 0.1.0
 */

import { Signature, type SignatureType } from "@tevm/voltaire/Signature";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import { SignatureTypeSchema } from "./SignatureSchema.js";

/**
 * Tuple signature format schema [yParity, r, s].
 */
const TupleSignatureSchema = S.Tuple(
	S.Number,
	S.Uint8ArrayFromSelf,
	S.Uint8ArrayFromSelf,
);

/**
 * Schema for Signature as tuple [yParity, r, s].
 *
 * @description
 * Transforms signature tuples to SignatureType and vice versa.
 * This format is commonly used in EIP-1559 and EIP-2930 transactions.
 *
 * @example Decoding
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 * import * as S from 'effect/Schema'
 *
 * const r = new Uint8Array(32).fill(0xab)
 * const s = new Uint8Array(32).fill(0xcd)
 * const sig = S.decodeSync(Signature.Tuple)([0, r, s])
 * ```
 *
 * @example Encoding
 * ```typescript
 * const [yParity, r, s] = S.encodeSync(Signature.Tuple)(sig)
 * ```
 *
 * @since 0.1.0
 */
export const Tuple: S.Schema<
	SignatureType,
	readonly [number, Uint8Array, Uint8Array]
> = S.transformOrFail(TupleSignatureSchema, SignatureTypeSchema, {
	strict: true,
	decode: (tuple, _options, ast) => {
		try {
			return ParseResult.succeed(
				Signature.fromTuple(tuple as [number, Uint8Array, Uint8Array]),
			);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, tuple, (e as Error).message),
			);
		}
	},
	encode: (sig, _options, ast) => {
		try {
			const tuple = Signature.toTuple(sig);
			return ParseResult.succeed(
				tuple as readonly [number, Uint8Array, Uint8Array],
			);
		} catch (e) {
			return ParseResult.fail(
				new ParseResult.Type(ast, sig, (e as Error).message),
			);
		}
	},
}).annotations({ identifier: "Signature.Tuple" });
