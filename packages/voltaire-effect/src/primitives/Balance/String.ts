/**
 * @fileoverview Schema for Balance from string.
 * @module Balance/String
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
 * Schema for Balance from string (decimal or hex).
 *
 * @example
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as S from 'effect/Schema'
 *
 * const balance = S.decodeSync(Balance.String)('1000000000000000000')
 * const hex = S.decodeSync(Balance.String)('0xde0b6b3a7640000')
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<BalanceType, string> = S.transformOrFail(
	S.String,
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
		encode: (balance) => ParseResult.succeed(balance.toString()),
	},
).annotations({ identifier: "Balance.String" });
