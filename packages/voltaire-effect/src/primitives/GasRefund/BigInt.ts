/**
 * @fileoverview Schema for GasRefund from bigint.
 * @module GasRefund/BigInt
 * @since 0.1.0
 */

import { GasRefund } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type GasRefundType = ReturnType<typeof GasRefund.from>;

const GasRefundTypeSchema = S.declare<GasRefundType>(
	(u): u is GasRefundType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasRefund" },
);

/**
 * Schema for GasRefund from bigint.
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import * as S from 'effect/Schema'
 *
 * const refund = S.decodeSync(GasRefund.BigInt)(15000n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<GasRefundType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	GasRefundTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(GasRefund.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (g) => ParseResult.succeed(g as bigint),
	},
).annotations({ identifier: "GasRefund.BigInt" });
