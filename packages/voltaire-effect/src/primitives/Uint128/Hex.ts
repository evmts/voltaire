/**
 * @fileoverview Schema for Uint128 encoded as a hex string.
 * @module Uint128/Hex
 * @since 0.1.0
 */

import { BrandedUint128 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint128Type = ReturnType<typeof BrandedUint128.from>;

const Uint128TypeSchema = S.declare<Uint128Type>(
	(u): u is Uint128Type => typeof u === "bigint" && BrandedUint128.isValid(u),
	{ identifier: "Uint128" },
);

/**
 * Schema for Uint128 encoded as a hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint128.Hex)('0xffffffffffffffffffffffffffffffff')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint128.Hex)(value)
 * // "0xffffffffffffffffffffffffffffffff"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint128Type, string> = S.transformOrFail(
	S.String,
	Uint128TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint128.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint128.toHex(uint));
		},
	},
).annotations({ identifier: "Uint128.Hex" });
