/**
 * @fileoverview Schema for MaxFeePerGas from bigint (wei).
 * @module MaxFeePerGas/BigInt
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type MaxFeePerGasType = bigint & { readonly __tag: "MaxFeePerGas" };

const MaxFeePerGasTypeSchema = S.declare<MaxFeePerGasType>(
	(u): u is MaxFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "MaxFeePerGas" },
);

/**
 * Schema for MaxFeePerGas from bigint (wei).
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const maxFee = S.decodeSync(MaxFeePerGas.BigInt)(50000000000n) // 50 gwei in wei
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<MaxFeePerGasType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	MaxFeePerGasTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					Uint.from(value) as unknown as MaxFeePerGasType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (maxFee) => ParseResult.succeed(maxFee as bigint),
	},
).annotations({ identifier: "MaxFeePerGas.BigInt" });
