/**
 * @fileoverview Schema for MaxPriorityFeePerGas from bigint (wei).
 * @module MaxPriorityFeePerGas/BigInt
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type MaxPriorityFeePerGasType = bigint & {
	readonly __tag: "MaxPriorityFeePerGas";
};

const MaxPriorityFeePerGasTypeSchema = S.declare<MaxPriorityFeePerGasType>(
	(u): u is MaxPriorityFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "MaxPriorityFeePerGas" },
);

/**
 * Schema for MaxPriorityFeePerGas from bigint (wei).
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const tip = S.decodeSync(MaxPriorityFeePerGas.BigInt)(2000000000n) // 2 gwei in wei
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<MaxPriorityFeePerGasType, bigint> =
	S.transformOrFail(S.BigIntFromSelf, MaxPriorityFeePerGasTypeSchema, {
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					Uint.from(value) as unknown as MaxPriorityFeePerGasType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (tip) => ParseResult.succeed(tip as bigint),
	}).annotations({ identifier: "MaxPriorityFeePerGas.BigInt" });
