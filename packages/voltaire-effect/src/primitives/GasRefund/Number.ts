/**
 * @fileoverview Schema for GasRefund from number.
 * @module GasRefund/Number
 * @since 0.1.0
 */

import { GasRefund } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { GasRefundType } from "./BigInt.js";

const GasRefundTypeSchema = S.declare<GasRefundType>(
	(u): u is GasRefundType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasRefund" },
);

/**
 * Schema for GasRefund from number.
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 * import * as S from 'effect/Schema'
 *
 * const refund = S.decodeSync(GasRefund.Number)(4800)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<GasRefundType, number> = S.transformOrFail(
	S.Number,
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
		encode: (g) => ParseResult.succeed(globalThis.Number(g)),
	},
).annotations({ identifier: "GasRefund.Number" });
