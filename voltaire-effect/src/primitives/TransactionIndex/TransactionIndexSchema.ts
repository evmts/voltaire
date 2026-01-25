import { TransactionIndex } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a transaction's position within a block.
 * @since 0.0.1
 */
export type TransactionIndexType = ReturnType<typeof TransactionIndex.from>;

/**
 * Internal schema declaration for TransactionIndex type validation.
 * @since 0.0.1
 */
const TransactionIndexTypeSchema = S.declare<TransactionIndexType>(
	(u): u is TransactionIndexType => {
		if (typeof u !== "number") return false;
		return Number.isInteger(u) && u >= 0;
	},
	{ identifier: "TransactionIndex" },
);

/**
 * Effect Schema for validating and transforming transaction indices.
 *
 * Transaction index represents the position of a transaction within a block,
 * starting from 0 for the first transaction.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as TransactionIndexSchema } from './TransactionIndexSchema.js'
 *
 * const index = Schema.decodeSync(TransactionIndexSchema)(5)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<TransactionIndexType, number | bigint> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf),
		TransactionIndexTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(TransactionIndex.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (i) => ParseResult.succeed(i as number),
		},
	).annotations({ identifier: "TransactionIndexSchema" });
