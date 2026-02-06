/**
 * @fileoverview Schema for BaseFeePerGas from bigint (wei).
 * @module BaseFeePerGas/BigInt
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type BaseFeePerGasType = bigint & { readonly __tag: "BaseFeePerGas" };

const BaseFeePerGasTypeSchema = S.declare<BaseFeePerGasType>(
	(u): u is BaseFeePerGasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "BaseFeePerGas" },
);

/**
 * Schema for BaseFeePerGas from bigint (wei).
 *
 * @example
 * ```typescript
 * import * as BaseFeePerGas from 'voltaire-effect/primitives/BaseFeePerGas'
 * import * as S from 'effect/Schema'
 *
 * const baseFee = S.decodeSync(BaseFeePerGas.BigInt)(20000000000n) // 20 gwei in wei
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<BaseFeePerGasType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	BaseFeePerGasTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					Uint.from(value) as unknown as BaseFeePerGasType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (baseFee) => ParseResult.succeed(baseFee as bigint),
	},
).annotations({ identifier: "BaseFeePerGas.BigInt" });
