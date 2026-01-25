/**
 * @fileoverview Schema for TransactionIndex encoded as a JavaScript number.
 * @module TransactionIndex/Number
 * @since 0.1.0
 */

import { TransactionIndex } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type TransactionIndexType = ReturnType<typeof TransactionIndex.from>;

const TransactionIndexTypeSchema = S.declare<TransactionIndexType>(
	(u): u is TransactionIndexType =>
		typeof u === "number" && globalThis.Number.isInteger(u) && u >= 0,
	{ identifier: "TransactionIndex" },
);

/**
 * Schema for TransactionIndex encoded as a JavaScript number.
 *
 * @description
 * Transaction index represents the zero-based position of a transaction within a block.
 *
 * @example Decoding
 * ```typescript
 * import * as TransactionIndex from 'voltaire-effect/primitives/TransactionIndex'
 * import * as S from 'effect/Schema'
 *
 * const index = S.decodeSync(TransactionIndex.Number)(5)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(TransactionIndex.Number)(index)
 * // 5
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<TransactionIndexType, number> = S.transformOrFail(
	S.Number,
	TransactionIndexTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(TransactionIndex.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (idx, _options, _ast) => {
			return ParseResult.succeed(TransactionIndex.toNumber(idx));
		},
	},
).annotations({ identifier: "TransactionIndex.Number" });
