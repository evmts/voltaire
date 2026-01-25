/**
 * @fileoverview Schema for Balance from bigint.
 * @module Balance/BigInt
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type BalanceType = bigint & { readonly __tag: "Balance" };

const BalanceTypeSchema = S.declare<BalanceType>(
	(u): u is BalanceType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Balance" },
);

/**
 * Schema for Balance from bigint.
 *
 * @example
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as S from 'effect/Schema'
 *
 * const balance = S.decodeSync(Balance.BigInt)(1000000000000000000n) // 1 ETH
 * const encoded = S.encodeSync(Balance.BigInt)(balance) // 1000000000000000000n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<BalanceType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
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
		encode: (balance) => ParseResult.succeed(balance as bigint),
	},
).annotations({ identifier: "Balance.BigInt" });
