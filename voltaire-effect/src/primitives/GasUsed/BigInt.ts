/**
 * @fileoverview Schema for GasUsed from bigint.
 * @module GasUsed/BigInt
 * @since 0.1.0
 */

import { GasUsed } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type GasUsedType = ReturnType<typeof GasUsed.from>;

const GasUsedTypeSchema = S.declare<GasUsedType>(
	(u): u is GasUsedType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasUsed" },
);

/**
 * Schema for GasUsed from bigint.
 *
 * @example
 * ```typescript
 * import * as GasUsed from 'voltaire-effect/primitives/GasUsed'
 * import * as S from 'effect/Schema'
 *
 * const used = S.decodeSync(GasUsed.BigInt)(21000n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<GasUsedType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	GasUsedTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(GasUsed.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (g) => ParseResult.succeed(g as bigint),
	},
).annotations({ identifier: "GasUsed.BigInt" });
