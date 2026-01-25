/**
 * @fileoverview Effect Schema for Int16 encoded as bigint.
 * @module Int16/BigInt
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int16Type } from "./Int16Schema.js";

const Int16TypeSchema = S.declare<Int16Type>(
	(u): u is Int16Type => typeof u === "number" && BrandedInt16.isValid(u),
	{ identifier: "Int16" },
);

/**
 * Schema for Int16 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int16Type and vice versa.
 * Accepts bigints in range -32768n to 32767n.
 *
 * @example Decoding
 * ```typescript
 * import * as Int16 from 'voltaire-effect/primitives/Int16'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int16.BigInt)(-1000n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int16Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int16TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt16.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(
				globalThis.BigInt(BrandedInt16.toNumber(value)),
			);
		},
	},
).annotations({ identifier: "Int16.BigInt" });
