/**
 * @fileoverview Effect Schema definitions for Uint256 validation and transformation.
 *
 * Provides type-safe schemas for validating and transforming values into Uint256,
 * supporting multiple input formats including decimal, hex strings, and byte arrays.
 *
 * @module Uint/UintSchema
 * @since 0.0.1
 */

import {
	isUint256,
	Uint256,
	type Type as Uint256Type,
} from "@tevm/voltaire/Uint";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * Internal schema declaration for Uint256 type validation.
 *
 * @description
 * Declares the Uint256 branded type for use in Effect Schema transformations.
 * This is used internally by the public schema exports.
 *
 * @internal
 * @since 0.0.1
 */
const Uint256TypeSchema = Schema.declare<Uint256Type>(
	(u): u is Uint256Type => isUint256(u),
	{ identifier: "Uint256" },
);

/**
 * Effect Schema for validating and transforming 256-bit unsigned integers.
 *
 * @description
 * Accepts bigint, number, or string inputs and validates them as Uint256 values.
 * Valid range: 0 to 2^256-1 (115792089237316195423570985008687907853269984665640564039457584007913129639935).
 *
 * Encoding converts the Uint256 back to a bigint for serialization.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { UintSchema } from '@voltaire-effect/primitives/Uint'
 *
 * // Decode from various formats
 * const fromString = Schema.decodeSync(UintSchema)('1000000000000000000')
 * const fromBigInt = Schema.decodeSync(UintSchema)(1000000000000000000n)
 * const fromNumber = Schema.decodeSync(UintSchema)(1000)
 *
 * // Encode back to bigint
 * const encoded = Schema.encodeSync(UintSchema)(fromString)
 * console.log(typeof encoded) // 'bigint'
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(UintSchema)('12345'))
 * ```
 *
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 2^256-1
 * @throws {ParseError} When string cannot be parsed as integer
 *
 * @see {@link UintFromHexSchema} for hex string inputs
 * @see {@link UintFromBytesSchema} for byte array inputs
 *
 * @since 0.0.1
 */
export const UintSchema: Schema.Schema<Uint256Type, bigint | number | string> =
	Schema.transformOrFail(
		Schema.Union(Schema.BigIntFromSelf, Schema.Number, Schema.String),
		Uint256TypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Uint256.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (uint) => ParseResult.succeed(Uint256.toBigInt(uint)),
		},
	);

/**
 * Effect Schema for validating Uint256 from hex strings.
 *
 * @description
 * Parses hexadecimal strings (with or without '0x' prefix) into Uint256 values.
 * Maximum 64 hex characters (256 bits). Encoding converts back to hex string format.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { UintFromHexSchema } from '@voltaire-effect/primitives/Uint'
 *
 * // Decode from hex (with or without prefix)
 * const value1 = Schema.decodeSync(UintFromHexSchema)('0xde0b6b3a7640000')
 * const value2 = Schema.decodeSync(UintFromHexSchema)('de0b6b3a7640000')
 *
 * // Encode back to hex
 * const hex = Schema.encodeSync(UintFromHexSchema)(value1)
 * console.log(hex) // '0xde0b6b3a7640000'
 * ```
 *
 * @throws {ParseError} When hex string contains invalid characters
 * @throws {ParseError} When resulting value exceeds 2^256-1
 *
 * @see {@link UintSchema} for decimal/bigint inputs
 * @see {@link UintFromBytesSchema} for byte array inputs
 *
 * @since 0.0.1
 */
export const UintFromHexSchema: Schema.Schema<Uint256Type, string> =
	Schema.transformOrFail(Schema.String, Uint256TypeSchema, {
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint) => ParseResult.succeed(Uint256.toHex(uint)),
	});

/**
 * Effect Schema for validating Uint256 from bytes.
 *
 * @description
 * Parses Uint8Array (big-endian, up to 32 bytes) into Uint256 values.
 * Shorter arrays are implicitly zero-padded on the left.
 * Encoding converts back to a 32-byte Uint8Array.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { UintFromBytesSchema } from '@voltaire-effect/primitives/Uint'
 *
 * // Decode from bytes
 * const bytes = new Uint8Array([0, 0, 0, 100]) // value = 100
 * const value = Schema.decodeSync(UintFromBytesSchema)(bytes)
 *
 * // Encode back to bytes (always 32 bytes)
 * const encoded = Schema.encodeSync(UintFromBytesSchema)(value)
 * console.log(encoded.length) // 32
 * ```
 *
 * @throws {ParseError} When byte array exceeds 32 bytes
 *
 * @see {@link UintSchema} for decimal/bigint inputs
 * @see {@link UintFromHexSchema} for hex string inputs
 *
 * @since 0.0.1
 */
export const UintFromBytesSchema: Schema.Schema<Uint256Type, Uint8Array> =
	Schema.transformOrFail(Schema.Uint8ArrayFromSelf, Uint256TypeSchema, {
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint) => ParseResult.succeed(Uint256.toBytes(uint)),
	});
