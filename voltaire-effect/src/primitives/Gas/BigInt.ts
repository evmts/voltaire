/**
 * @fileoverview Effect Schema for Gas from bigint encoding.
 * Provides bidirectional transformation between bigints and GasType.
 *
 * @module BigInt
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { GasType } from "./Number.js";

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
 * Schema for Gas encoded as a bigint.
 *
 * @description
 * Transforms bigints to GasType and vice versa.
 * Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 * import * as S from 'effect/Schema'
 *
 * const gas = S.decodeSync(Gas.BigInt)(21000n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Gas.BigInt)(gas)
 * // 21000n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<GasType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
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
			return ParseResult.succeed(gas as bigint);
		},
	},
).annotations({ identifier: "Gas.BigInt" });
