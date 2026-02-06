/**
 * @fileoverview Schema for Uint128 encoded as bytes.
 * @module Uint128/Bytes
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
 * Schema for Uint128 encoded as a Uint8Array (16 bytes, big-endian).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(16).fill(0xff)
 * const value = S.decodeSync(Uint128.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint128.Bytes)(value)
 * // Uint8Array (16 bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint128Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint128TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint128.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint128.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint128.Bytes" });
