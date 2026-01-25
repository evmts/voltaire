/**
 * @fileoverview Schema for BaseFeePerGas from gwei.
 * @module BaseFeePerGas/Gwei
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { BaseFeePerGasType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

const BaseFeePerGasTypeSchema = S.declare<BaseFeePerGasType>(
	(u): u is BaseFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "BaseFeePerGas" },
);

/**
 * Schema for BaseFeePerGas from gwei.
 * Decodes gwei to wei, encodes wei to gwei.
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const baseFee = S.decodeSync(BaseFeePerGas.Gwei)(20) // 20 gwei -> 20000000000n wei
 * const gwei = S.encodeSync(BaseFeePerGas.Gwei)(baseFee) // 20n
 * ```
 *
 * @since 0.1.0
 */
export const Gwei: S.Schema<BaseFeePerGasType, number | bigint> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf),
		BaseFeePerGasTypeSchema,
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
								"BaseFeePerGas cannot be negative",
							),
						);
					}
					return ParseResult.succeed(
						(gwei * GWEI) as unknown as BaseFeePerGasType,
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (baseFee) => ParseResult.succeed(baseFee / GWEI),
		},
	).annotations({ identifier: "BaseFeePerGas.Gwei" });
