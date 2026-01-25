/**
 * @fileoverview Schema for Bytes32 encoded as Uint8Array.
 * @module voltaire-effect/primitives/Bytes32/Bytes
 * @since 0.1.0
 */

import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const Bytes32TypeSchema = S.declare<Bytes32Type>(
	(u): u is Bytes32Type => u instanceof Uint8Array && u.length === 32,
	{ identifier: "Bytes32" },
);

/**
 * Schema for Bytes32 encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array (must be exactly 32 bytes) to Bytes32Type and vice versa.
 * Validates input is exactly 32 bytes.
 *
 * @example Decoding
 * ```typescript
 * import * as Bytes32 from 'voltaire-effect/primitives/Bytes32'
 * import * as S from 'effect/Schema'
 *
 * const b32 = S.decodeSync(Bytes32.Bytes)(new Uint8Array(32))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Bytes32.Bytes)(b32)
 * // Uint8Array (32 bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Bytes32Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Bytes32TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Bytes32.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (b, _options, _ast) => {
			return ParseResult.succeed(b as Uint8Array);
		},
	},
).annotations({ identifier: "Bytes32.Bytes" });
