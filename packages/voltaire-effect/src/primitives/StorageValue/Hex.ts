/**
 * @fileoverview Effect Schema definitions for EVM storage values.
 * Provides validation schemas for storage slot values.
 * @module StorageValue/StorageValueSchema
 * @since 0.0.1
 */

import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Represents a value stored in an EVM storage slot.
 *
 * @description
 * A StorageValue is a 32-byte value that can be stored in any EVM storage slot.
 * The EVM uses a word-addressable storage model where each slot holds exactly
 * 32 bytes (256 bits).
 *
 * Storage values can represent:
 * - Unsigned integers (uint256)
 * - Signed integers (int256)
 * - Addresses (padded to 32 bytes)
 * - Booleans (0 or 1)
 * - Packed structs
 * - Bytes32 values
 *
 * @example
 * ```typescript
 * import { StorageValue } from 'voltaire-effect/primitives'
 *
 * // Store a uint256
 * const value = StorageValue.from(1000000000000000000n)
 *
 * // Store zero (common for deleted/unset slots)
 * const zero = StorageValue.zero()
 * ```
 *
 * @since 0.0.1
 */
export type StorageValueType = Bytes32Type & { readonly __tag: "StorageValue" };

const StorageValueTypeSchema = S.declare<StorageValueType>(
	(u): u is StorageValueType => {
		if (!(u instanceof Uint8Array)) return false;
		return u.length === 32;
	},
	{ identifier: "StorageValue" },
);

/**
 * Effect Schema for validating and transforming storage values.
 *
 * @description
 * This schema transforms various input formats into a normalized 32-byte
 * StorageValueType. It accepts hex strings, Uint8Arrays, bigints, and numbers,
 * converting them to the canonical 32-byte representation.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { StorageValueSchema } from 'voltaire-effect/primitives/StorageValue'
 *
 * const parse = S.decodeSync(StorageValueSchema)
 *
 * // From bigint (most common)
 * const value1 = parse(1000000000000000000n)
 *
 * // From hex string
 * const value2 = parse('0x0000000000000000000000000000000000000000000000000de0b6b3a7640000')
 *
 * // From number
 * const value3 = parse(42)
 *
 * // From Uint8Array
 * const value4 = parse(new Uint8Array(32))
 * ```
 *
 * @throws {ParseError} When the input cannot be converted to a valid 32-byte value
 *
 * @see {@link StorageValueType} for the output type
 * @see {@link from} for Effect-based creation
 *
 * @since 0.0.1
 */
export const StorageValueSchema: S.Schema<
	StorageValueType,
	string | Uint8Array | bigint | number
> = S.transformOrFail(
	S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
	StorageValueTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(
					Bytes32.Bytes32(
						s as string | Uint8Array | bigint | number,
					) as StorageValueType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b) => ParseResult.succeed(b),
	},
).annotations({ identifier: "StorageValueSchema" });
