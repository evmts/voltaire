/**
 * @fileoverview Schema for Uint32 encoded as bytes.
 * @module Uint32/Bytes
 * @since 0.1.0
 */

import { BrandedUint32 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint32Type = ReturnType<typeof BrandedUint32.from>;

const Uint32TypeSchema = S.declare<Uint32Type>(
	(u): u is Uint32Type => typeof u === "number" && BrandedUint32.isValid(u),
	{ identifier: "Uint32" },
);

/**
 * Schema for Uint32 encoded as a Uint8Array (4 bytes, big-endian).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint32.Bytes)(new Uint8Array([0xff, 0xff, 0xff, 0xff]))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint32.Bytes)(value)
 * // Uint8Array([0xff, 0xff, 0xff, 0xff])
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint32Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint32TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint32.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint32.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint32.Bytes" });
