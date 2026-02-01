/**
 * @fileoverview Schema for Balance from number.
 * @module Balance/Number
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { BalanceType } from "./BigInt.js";

const BalanceTypeSchema = S.declare<BalanceType>(
	(u): u is BalanceType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Balance" },
);

/**
 * Schema for Balance from number.
 *
 * @example
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as S from 'effect/Schema'
 *
 * const balance = S.decodeSync(Balance.Number)(1000000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<BalanceType, number> = S.transformOrFail(
	S.Number,
	BalanceTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(Uint.from(value) as unknown as BalanceType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (balance) => ParseResult.succeed(globalThis.Number(balance)),
	},
).annotations({ identifier: "Balance.Number" });
