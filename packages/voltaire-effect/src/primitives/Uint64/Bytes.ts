/**
 * @fileoverview Schema for Uint64 encoded as bytes.
 * @module Uint64/Bytes
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
 * Schema for Uint64 encoded as a Uint8Array (8 bytes, big-endian).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(8).fill(0xff)
 * const value = S.decodeSync(Uint64.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint64.Bytes)(value)
 * // Uint8Array (8 bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint64Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint64TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Uint64.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint64.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint64.Bytes" });
