/**
 * @fileoverview Schema for TransactionHash encoded as a hex string.
 * @module TransactionHash/Hex
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
 * Schema for TransactionHash encoded as a hex string.
 *
 * @description
 * Transforms 66-character hex strings (0x + 64 hex chars) to 32-byte TransactionHash.
 *
 * @example Decoding
 * ```typescript
 * import * as TransactionHash from 'voltaire-effect/primitives/TransactionHash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(TransactionHash.Hex)(
 *   '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * )
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(TransactionHash.Hex)(hash)
 * // "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<TransactionHashType, string> = S.transformOrFail(
	S.String,
	TransactionHashTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					TransactionHash.from(s) as unknown as TransactionHashType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (hash, _options, _ast) => {
			return ParseResult.succeed(TransactionHash.toHex(hash as any));
		},
	},
).annotations({ identifier: "TransactionHash.Hex" });
