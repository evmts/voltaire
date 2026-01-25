/**
 * @fileoverview Hex module for Effect-based hex string handling.
 *
 * @description
 * Provides Effect-wrapped functions and schemas for working with Ethereum
 * hex strings. All functions return Effects instead of throwing, enabling
 * composable error handling and railway-oriented programming.
 *
 * Hex strings are the standard format for representing binary data in Ethereum:
 * - Addresses: `0x742d35Cc6634C0532925a3b844Bc9e7595f...`
 * - Transaction hashes: `0x...`
 * - Calldata: `0x...`
 * - Storage values: `0x...`
 *
 * This module provides:
 * - {@link from} - Create Hex from string or bytes (fallible)
 * - {@link fromBytes} - Create Hex from bytes (infallible)
 * - {@link fromNumber} - Create Hex from number (fallible)
 * - {@link fromBigInt} - Create Hex from bigint (fallible)
 * - {@link fromString} - Create Hex from UTF-8 string (fallible)
 * - {@link fromBoolean} - Create Hex from boolean (infallible)
 * - {@link toBytes} - Convert Hex to Uint8Array
 * - {@link toNumber} - Convert Hex to number (fallible)
 * - {@link toBigInt} - Convert Hex to bigint (fallible)
 * - {@link toString} - Convert Hex to UTF-8 string (infallible)
 * - {@link toBoolean} - Convert Hex to boolean (fallible)
 * - {@link size} - Get byte size of Hex string
 * - {@link Schema} - Effect Schema for validation/parsing
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // Create hex from string
 * const hex = await Effect.runPromise(Hex.from('0xdeadbeef'))
 *
 * // Convert to bytes
 * const bytes = await Effect.runPromise(Hex.toBytes(hex))
 *
 * // Get size
 * const byteSize = await Effect.runPromise(Hex.size(hex)) // 4
 *
 * // Use Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Hex.Schema)('0xabcd')
 * ```
 *
 * @module voltaire-effect/primitives/Hex
 * @since 0.0.1
 */

export { Schema } from './HexSchema.js'
export { from } from './from.js'
export { fromBytes } from './fromBytes.js'
export { fromNumber } from './fromNumber.js'
export { fromBigInt } from './fromBigInt.js'
export { fromString } from './fromString.js'
export { fromBoolean } from './fromBoolean.js'
export { toBytes } from './toBytes.js'
export { toNumber } from './toNumber.js'
export { toBigInt } from './toBigInt.js'
export { toString } from './toString.js'
export { toBoolean } from './toBoolean.js'
export { size } from './size.js'
export { concat } from './concat.js'
export { slice } from './slice.js'
export { pad } from './pad.js'
export { padRight } from './padRight.js'
export { trim } from './trim.js'
export { equals } from './equals.js'
export { clone } from './clone.js'
export { xor } from './xor.js'
export { random } from './random.js'
export { zero } from './zero.js'
export { isHex } from './isHex.js'
export { validate } from './validate.js'
export { isSized } from './isSized.js'
export { assertSize } from './assertSize.js'

/**
 * Branded type for validated hex strings.
 *
 * @description
 * A string branded as HexType is guaranteed to:
 * - Start with '0x' prefix
 * - Contain only valid hex characters (0-9, a-f, A-F)
 * - Have an even number of characters (excluding prefix)
 *
 * @see {@link from} - Create HexType values
 * @since 0.0.1
 */
export type { HexType } from '@tevm/voltaire/Hex'

/**
 * The Hex brand symbol for type discrimination.
 *
 * @description
 * Used for TypeScript branded type identification. Typically not used
 * directly - use HexType instead.
 *
 * @since 0.0.1
 */
export type { Hex as HexBrand } from '@tevm/voltaire/Hex'
