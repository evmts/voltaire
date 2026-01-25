/**
 * @fileoverview Effect Schema for Bytes validation and transformation.
 * Provides type-safe parsing of arbitrary byte data from multiple input formats.
 * @module voltaire-effect/primitives/Bytes/BytesSchema
 * @since 0.0.1
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Internal schema for validating Bytes.
 *
 * @description
 * Declares a schema that validates a value is a proper BytesType (Uint8Array).
 * Used internally by the public Schema for the transformation target.
 *
 * @internal
 */
const BytesTypeSchema = S.declare<BytesType>(
	(u): u is BytesType => u instanceof Uint8Array,
	{ identifier: "BytesType" },
);

/**
 * Effect Schema for validating and parsing arbitrary bytes.
 *
 * @description
 * A bidirectional schema that transforms various input formats into branded BytesType.
 * Accepts hex strings (with 0x prefix), Uint8Array, or number arrays where each
 * number represents a byte value (0-255).
 *
 * The schema can be used with all Effect Schema operations:
 * - `S.decodeSync` / `S.decode` for parsing
 * - `S.encodeSync` / `S.encode` for serialization
 * - `S.validate` for validation only
 * - `S.is` for type guards
 *
 * @type {S.Schema<BytesType, Uint8Array | string | readonly number[]>}
 *
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/Bytes'
 * import * as S from 'effect/Schema'
 *
 * // From hex string
 * const bytes1 = S.decodeSync(Schema)('0xdeadbeef')
 * // BytesType (Uint8Array)
 *
 * // From Uint8Array (passthrough)
 * const bytes2 = S.decodeSync(Schema)(new Uint8Array([1, 2, 3]))
 * // BytesType (Uint8Array)
 *
 * // From number array
 * const bytes3 = S.decodeSync(Schema)([0xde, 0xad, 0xbe, 0xef])
 * // BytesType (Uint8Array)
 *
 * // Async decoding with Effect
 * import * as Effect from 'effect/Effect'
 * const bytesEffect = S.decode(Schema)('0xabcd')
 * const result = await Effect.runPromise(bytesEffect)
 *
 * // Type guard
 * if (S.is(Schema)(value)) {
 *   // value is BytesType
 * }
 *
 * // Error handling
 * try {
 *   S.decodeSync(Schema)('invalid')
 * } catch (e) {
 *   // ParseError with details
 * }
 * ```
 *
 * @throws {ParseError} When decoding fails due to invalid input format
 *   or byte values out of range
 *
 * @see {@link from} - Effect-based conversion function
 * @see BytesType - The branded output type
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<
	BytesType,
	Uint8Array | string | readonly number[]
> = S.transformOrFail(
	S.Union(S.Uint8ArrayFromSelf, S.String, S.Array(S.Number)),
	BytesTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					VoltaireBytes(s as Uint8Array | string | number[]),
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b) => ParseResult.succeed(b as Uint8Array),
	},
).annotations({ identifier: "BytesSchema" });
