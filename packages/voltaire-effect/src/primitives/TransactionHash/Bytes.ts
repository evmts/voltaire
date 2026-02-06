/**
 * @fileoverview Schema for TransactionHash encoded as bytes.
 * @module TransactionHash/Bytes
 * @since 0.1.0
 */

import { TransactionHash } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type TransactionHashType = Uint8Array & { readonly __tag: "TransactionHash" };

const TransactionHashTypeSchema = S.declare<TransactionHashType>(
	(u): u is TransactionHashType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "TransactionHash" },
);

/**
 * Schema for TransactionHash encoded as a Uint8Array.
 *
 * @description
 * Validates that the input is exactly 32 bytes.
 *
 * @example Decoding
 * ```typescript
 * import * as TransactionHash from 'voltaire-effect/primitives/TransactionHash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(TransactionHash.Bytes)(bytes32)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(TransactionHash.Bytes)(hash)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<TransactionHashType, Uint8Array> =
	S.transformOrFail(S.Uint8ArrayFromSelf, TransactionHashTypeSchema, {
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(
					TransactionHash.fromBytes(bytes) as unknown as TransactionHashType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (hash, _options, _ast) => {
			return ParseResult.succeed(hash as Uint8Array);
		},
	}).annotations({ identifier: "TransactionHash.Bytes" });
