/**
 * @fileoverview Hex size calculation function.
 * Calculates the byte length of a hex string.
 * @module voltaire-effect/primitives/Hex/size
 * @since 0.0.1
 */

import { Hex as VoltaireHex, type HexType } from '@tevm/voltaire/Hex'
import * as Effect from 'effect/Effect'

/**
 * Returns the byte size of a Hex string.
 *
 * @description
 * Calculates the number of bytes represented by a hex string. Since each
 * byte is represented by 2 hex characters, this is essentially
 * `(hex.length - 2) / 2` (accounting for the 0x prefix).
 *
 * This operation is infallible - the Effect never fails. The input is
 * assumed to be a valid hex string (either branded HexType or a raw string
 * that follows hex format).
 *
 * @param {HexType | string} hex - Hex string to measure. Can be branded HexType
 *   or a raw string with 0x prefix.
 * @returns {Effect.Effect<number, never>} Effect that always succeeds with the
 *   byte count as a non-negative integer.
 *
 * @example
 * ```ts
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as Effect from 'effect/Effect'
 *
 * // 4 bytes (de ad be ef)
 * const size1 = await Effect.runPromise(Hex.size('0xdeadbeef')) // 4
 *
 * // Empty hex has 0 bytes
 * const size2 = await Effect.runPromise(Hex.size('0x')) // 0
 *
 * // Single byte
 * const size3 = await Effect.runPromise(Hex.size('0xff')) // 1
 *
 * // 20 bytes (Ethereum address length)
 * const addressHex = '0x742d35Cc6634C0532925a3b844Bc454e4438f44E'
 * const size4 = await Effect.runPromise(Hex.size(addressHex)) // 20
 *
 * // 32 bytes (hash/storage slot length)
 * const hashHex = '0x' + 'ab'.repeat(32)
 * const size5 = await Effect.runPromise(Hex.size(hashHex)) // 32
 *
 * // Use in Effect pipeline
 * const pipeline = Effect.gen(function* () {
 *   const hex = yield* Hex.from('0xdeadbeef')
 *   const byteSize = yield* Hex.size(hex)
 *   return byteSize
 * })
 * ```
 *
 * @see {@link from} - Create Hex values
 * @see {@link toBytes} - Convert to Uint8Array to get actual bytes
 *
 * @since 0.0.1
 */
export const size = (hex: HexType | string): Effect.Effect<number, never> =>
  Effect.succeed(VoltaireHex.size(hex as HexType))
