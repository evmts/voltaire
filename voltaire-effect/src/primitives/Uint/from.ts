/**
 * @fileoverview Effect-based constructors for Uint256 (256-bit unsigned integers).
 * 
 * Provides functional Effect wrappers around the core Uint256 primitives,
 * enabling safe error handling and composition in Effect pipelines.
 * 
 * @module Uint/from
 * @since 0.0.1
 */

import { Uint256, type Type as Uint256Type } from '@tevm/voltaire/Uint'
import * as Effect from 'effect/Effect'

/**
 * Error type for Uint256 operations.
 * 
 * @description
 * Represents any error that can occur during Uint256 construction or manipulation.
 * This includes range errors (values outside 0 to 2^256-1), parsing errors for
 * invalid hex strings, and byte array length errors.
 * 
 * @since 0.0.1
 */
export type UintError = Error

/**
 * Creates a Uint256 from a bigint, number, or string.
 * 
 * @description
 * Parses the input value and creates a validated Uint256. The value must be
 * a non-negative integer within the range 0 to 2^256-1 (inclusive).
 * - Numbers must be safe integers (no decimals, within Number.MAX_SAFE_INTEGER)
 * - Strings are parsed as decimal numbers
 * - BigInts are used directly
 * 
 * @param value - Value to convert to Uint256
 * @returns Effect containing the Uint256 or UintError if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * 
 * // From bigint
 * const fromBigint = await Effect.runPromise(Uint.from(1000000000000000000n))
 * 
 * // From string
 * const fromString = await Effect.runPromise(Uint.from('1000000000000000000'))
 * 
 * // From number
 * const fromNumber = await Effect.runPromise(Uint.from(1000))
 * ```
 * 
 * @throws {UintError} When value is negative or exceeds 2^256-1
 * @throws {UintError} When string cannot be parsed as a valid integer
 * 
 * @see {@link fromHex} for creating from hex strings
 * @see {@link fromBytes} for creating from byte arrays
 * @see {@link fromBigInt} for creating specifically from bigint
 * @see {@link fromNumber} for creating specifically from number
 * 
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.from(value),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a hex string.
 * 
 * @description
 * Parses a hexadecimal string and creates a validated Uint256. The hex string
 * may optionally include the '0x' prefix. The resulting value must be within
 * the range 0 to 2^256-1 (maximum 64 hex characters).
 * 
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Effect containing the Uint256 or UintError if parsing fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * 
 * // With 0x prefix
 * const value1 = await Effect.runPromise(Uint.fromHex('0xde0b6b3a7640000'))
 * 
 * // Without prefix
 * const value2 = await Effect.runPromise(Uint.fromHex('de0b6b3a7640000'))
 * 
 * // Max value (64 f's)
 * const max = await Effect.runPromise(Uint.fromHex('0x' + 'f'.repeat(64)))
 * ```
 * 
 * @throws {UintError} When hex string contains invalid characters
 * @throws {UintError} When resulting value exceeds 2^256-1
 * 
 * @see {@link from} for creating from decimal strings or numbers
 * @see {@link fromBytes} for creating from byte arrays
 * 
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromHex(hex),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from raw bytes.
 * 
 * @description
 * Interprets a Uint8Array as a big-endian unsigned integer and creates a
 * validated Uint256. The byte array must be at most 32 bytes (256 bits).
 * Shorter arrays are implicitly zero-padded on the left.
 * 
 * @param bytes - Uint8Array (up to 32 bytes, big-endian)
 * @returns Effect containing the Uint256 or UintError if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * 
 * // 32-byte array representing a value
 * const bytes = new Uint8Array(32)
 * bytes[31] = 100 // value = 100
 * const value = await Effect.runPromise(Uint.fromBytes(bytes))
 * 
 * // Shorter arrays are zero-padded
 * const short = await Effect.runPromise(Uint.fromBytes(new Uint8Array([1, 0]))) // = 256
 * ```
 * 
 * @throws {UintError} When byte array exceeds 32 bytes
 * 
 * @see {@link from} for creating from decimal values
 * @see {@link fromHex} for creating from hex strings
 * 
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromBytes(bytes),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a JavaScript number.
 * 
 * @description
 * Creates a Uint256 from a JavaScript number. The number must be a non-negative
 * safe integer (0 to Number.MAX_SAFE_INTEGER = 2^53-1). For larger values,
 * use {@link fromBigInt} instead.
 * 
 * @param value - Number value (must be non-negative safe integer)
 * @returns Effect containing the Uint256 or UintError if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * 
 * const value = await Effect.runPromise(Uint.fromNumber(1000))
 * const max = await Effect.runPromise(Uint.fromNumber(Number.MAX_SAFE_INTEGER))
 * ```
 * 
 * @throws {UintError} When value is negative
 * @throws {UintError} When value is not a safe integer
 * @throws {UintError} When value has decimal places
 * 
 * @see {@link fromBigInt} for values larger than MAX_SAFE_INTEGER
 * @see {@link from} for automatic type detection
 * 
 * @since 0.0.1
 */
export const fromNumber = (value: number): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromNumber(value),
    catch: (e) => e as UintError
  })

/**
 * Creates a Uint256 from a bigint.
 * 
 * @description
 * Creates a Uint256 from a BigInt value. The value must be within the range
 * 0 to 2^256-1 (115792089237316195423570985008687907853269984665640564039457584007913129639935).
 * 
 * Min value: 0n
 * Max value: 2n ** 256n - 1n
 * 
 * @param value - BigInt value (0 to 2^256-1)
 * @returns Effect containing the Uint256 or UintError if validation fails
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Uint from '@voltaire-effect/primitives/Uint'
 * 
 * // 1 ETH in wei
 * const oneEth = await Effect.runPromise(Uint.fromBigInt(1000000000000000000n))
 * 
 * // Max uint256
 * const max = await Effect.runPromise(Uint.fromBigInt(2n ** 256n - 1n))
 * 
 * // Zero
 * const zero = await Effect.runPromise(Uint.fromBigInt(0n))
 * ```
 * 
 * @throws {UintError} When value is negative
 * @throws {UintError} When value exceeds 2^256-1
 * 
 * @see {@link fromNumber} for safe integer values
 * @see {@link from} for automatic type detection
 * 
 * @since 0.0.1
 */
export const fromBigInt = (value: bigint): Effect.Effect<Uint256Type, UintError> =>
  Effect.try({
    try: () => Uint256.fromBigInt(value),
    catch: (e) => e as UintError
  })
