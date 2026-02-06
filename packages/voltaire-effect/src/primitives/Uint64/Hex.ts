/**
 * @fileoverview Schema for Uint64 encoded as a hex string.
 * @module Uint64/Hex
 * @since 0.1.0
 */

import { Uint64 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint64Type = ReturnType<typeof Uint64.from>;

const Uint64TypeSchema = S.declare<Uint64Type>(
	(u): u is Uint64Type => typeof u === "bigint" && Uint64.isValid(u),
	{ identifier: "Uint64" },
);

/**
 * Schema for Uint64 encoded as a hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint64.Hex)('0xffffffffffffffff')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint64.Hex)(value)
 * // "0xffffffffffffffff"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint64Type, string> = S.transformOrFail(
	S.String,
	Uint64TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(Uint64.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint64.toHex(uint));
		},
	},
).annotations({ identifier: "Uint64.Hex" });
