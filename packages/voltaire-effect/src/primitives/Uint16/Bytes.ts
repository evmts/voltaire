/**
 * @fileoverview Schema for Uint16 encoded as bytes.
 * @module Uint16/Bytes
 * @since 0.1.0
 */

import { BrandedUint16 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint16Type = ReturnType<typeof BrandedUint16.from>;

const Uint16TypeSchema = S.declare<Uint16Type>(
	(u): u is Uint16Type => typeof u === "number" && BrandedUint16.isValid(u),
	{ identifier: "Uint16" },
);

/**
 * Schema for Uint16 encoded as a Uint8Array (2 bytes, big-endian).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint16.Bytes)(new Uint8Array([0xff, 0xff]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint16.Bytes)(value)
 * // Uint8Array([0xff, 0xff])
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint16Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint16TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint16.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint16.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint16.Bytes" });
