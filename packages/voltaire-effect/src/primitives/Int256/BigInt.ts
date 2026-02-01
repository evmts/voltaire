/**
 * @fileoverview Effect Schema for Int256 encoded as bigint.
 * @module Int256/BigInt
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int256Type } from "./Int256Schema.js";

const Int256TypeSchema = S.declare<Int256Type>(
	(u): u is Int256Type => typeof u === "bigint",
	{ identifier: "Int256" },
);

/**
 * Schema for Int256 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int256Type and vice versa.
 * Accepts bigints in range -2^255 to 2^255-1.
 * This is the native signed integer type used in Solidity smart contracts.
 *
 * @example Decoding
 * ```typescript
 * import * as Int256 from 'voltaire-effect/primitives/Int256'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int256.BigInt)(-57896044618658097711785492504343953926634992332820282019728792003956564819968n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int256Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int256TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt256.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt256.toBigInt(value));
		},
	},
).annotations({ identifier: "Int256.BigInt" });
