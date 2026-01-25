/**
 * @fileoverview Bytes module for Effect-based arbitrary byte array handling.
 *
 * @description
 * Provides Effect-wrapped functions and schemas for working with arbitrary
 * byte arrays. All functions return Effects instead of throwing, enabling
 * composable error handling and railway-oriented programming.
 *
 * Bytes are the fundamental data type in Ethereum for:
 * - Raw calldata
 * - Contract bytecode
 * - Event data
 * - Arbitrary binary data
 *
 * Unlike {@link Bytes32} which is fixed at 32 bytes, this module handles
 * byte arrays of any length.
 *
 * This module provides:
 * - {@link from} - Create Bytes from string, array, or Uint8Array (fallible)
 * - {@link Schema} - Effect Schema for validation/parsing
 *
 * @example
 * ```typescript
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 * import * as Effect from 'effect/Effect'
 *
 * // Create bytes from hex string
 * const bytes = await Effect.runPromise(Bytes.from('0xdeadbeef'))
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 *
 * // Create from number array
 * const bytes2 = await Effect.runPromise(Bytes.from([1, 2, 3, 4]))
 * // Uint8Array([1, 2, 3, 4])
 *
 * // Use Schema for validation
 * import * as S from 'effect/Schema'
 * const validated = S.decodeSync(Bytes.Schema)('0xabcd')
 * ```
 *
 * @module voltaire-effect/primitives/Bytes
 * @since 0.0.1
 */

export { Schema } from './BytesSchema.js'
export { from } from './from.js'
export { fromHex } from './fromHex.js'
export { fromString } from './fromString.js'
export { toHex } from './toHex.js'
export { toString } from './toString.js'
export { equals } from './equals.js'
export { concat } from './concat.js'
export { slice } from './slice.js'
export { isBytes } from './isBytes.js'
export { random } from './random.js'
export { size } from './size.js'

/**
 * Branded type for validated byte arrays.
 *
 * @description
 * A Uint8Array branded as BytesType. The branding ensures type safety
 * when working with byte data that has been validated through the
 * Bytes module functions.
 *
 * @see {@link from} - Create BytesType values
 * @since 0.0.1
 */
export type { BytesType } from '@tevm/voltaire/Bytes'
