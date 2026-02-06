/**
 * @fileoverview Effect Schema for Gas from number encoding.
 * Provides bidirectional transformation between numbers and GasType.
 *
 * @module Number
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded bigint type representing a gas amount.
 *
 * @description
 * Gas is the unit of computational effort in the Ethereum Virtual Machine.
 * Every operation costs a certain amount of gas.
 */
export type GasType = bigint & { readonly __tag: "Gas" };

/**
 * Internal schema declaration for GasType.
 * Validates that a value is a non-negative bigint.
 *
 * @internal
 */
const GasTypeSchema = S.declare<GasType>(
	(u): u is GasType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Gas" },
);

/**
 * Schema for Gas encoded as a number.
 *
 * @description
 * Transforms numbers to GasType and vice versa.
 * Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import * as S from 'effect/Schema'
 *
 * const gas = S.decodeSync(Gas.Number)(21000)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Gas.Number)(gas)
 * // 21000
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<GasType, number> = S.transformOrFail(
	S.Number,
	GasTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint.from(n) as unknown as GasType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (gas, _options, _ast) => {
			return ParseResult.succeed(globalThis.Number(gas));
		},
	},
).annotations({ identifier: "Gas.Number" });
