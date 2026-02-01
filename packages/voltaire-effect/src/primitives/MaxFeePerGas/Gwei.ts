/**
 * @fileoverview Schema for MaxFeePerGas from gwei.
 * @module MaxFeePerGas/Gwei
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { MaxFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

const MaxFeePerGasTypeSchema = S.declare<MaxFeePerGasType>(
	(u): u is MaxFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "MaxFeePerGas" },
);

/**
 * Schema for MaxFeePerGas from gwei.
 * Decodes gwei to wei, encodes wei to gwei.
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const maxFee = S.decodeSync(MaxFeePerGas.Gwei)(50) // 50 gwei -> wei
 * const gwei = S.encodeSync(MaxFeePerGas.Gwei)(maxFee) // 50n
 * ```
 *
 * @since 0.1.0
 */
export const Gwei: S.Schema<MaxFeePerGasType, number | bigint> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf),
		MaxFeePerGasTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					const gwei =
						typeof value === "number" ? globalThis.BigInt(value) : value;
					if (gwei < 0n) {
						return ParseResult.fail(
							new ParseResult.Type(
								ast,
								value,
								"MaxFeePerGas cannot be negative",
							),
						);
					}
					return ParseResult.succeed(
						(gwei * GWEI) as unknown as MaxFeePerGasType,
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (maxFee) => ParseResult.succeed(maxFee / GWEI),
		},
	).annotations({ identifier: "MaxFeePerGas.Gwei" });
