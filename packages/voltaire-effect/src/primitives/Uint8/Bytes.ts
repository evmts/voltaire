/**
 * @fileoverview Schema for Uint8 encoded as bytes.
 * @module Uint8/Bytes
 * @since 0.1.0
 */

import { BrandedUint8 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint8Type = ReturnType<typeof BrandedUint8.from>;

const Uint8TypeSchema = S.declare<Uint8Type>(
	(u): u is Uint8Type => typeof u === "number" && BrandedUint8.isValid(u),
	{ identifier: "Uint8" },
);

/**
 * Schema for Uint8 encoded as a Uint8Array (single byte).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint8.Bytes)(new Uint8Array([255]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint8.Bytes)(value)
 * // Uint8Array([255])
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint8Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint8TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint8.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint8.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint8.Bytes" });
