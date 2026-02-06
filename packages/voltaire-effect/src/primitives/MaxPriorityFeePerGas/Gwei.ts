/**
 * @fileoverview Schema for MaxPriorityFeePerGas from gwei.
 * @module MaxPriorityFeePerGas/Gwei
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { MaxPriorityFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

const MaxPriorityFeePerGasTypeSchema = S.declare<MaxPriorityFeePerGasType>(
	(u): u is MaxPriorityFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "MaxPriorityFeePerGas" },
);

/**
 * Schema for MaxPriorityFeePerGas from gwei.
 * Decodes gwei to wei, encodes wei to gwei.
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const tip = S.decodeSync(MaxPriorityFeePerGas.Gwei)(2) // 2 gwei -> wei
 * const gwei = S.encodeSync(MaxPriorityFeePerGas.Gwei)(tip) // 2n
 * ```
 *
 * @since 0.1.0
 */
export const Gwei: S.Schema<MaxPriorityFeePerGasType, number | bigint> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf),
		MaxPriorityFeePerGasTypeSchema,
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
								"MaxPriorityFeePerGas cannot be negative",
							),
						);
					}
					return ParseResult.succeed(
						(gwei * GWEI) as unknown as MaxPriorityFeePerGasType,
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (tip) => ParseResult.succeed(tip / GWEI),
		},
	).annotations({ identifier: "MaxPriorityFeePerGas.Gwei" });
