/**
 * @fileoverview Effect-based address creation from byte arrays.
 * Provides a safe, never-throwing function for converting 20-byte arrays to addresses.
 * 
 * @module fromBytes
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressLengthError } from '@tevm/voltaire/Address'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from a 20-byte Uint8Array.
 * 
 * @description
 * This function converts a byte array to an AddressType. It validates that
 * the input is exactly 20 bytes, as required for Ethereum addresses.
 * Unlike the direct Voltaire `Address.fromBytes()` method, this function
 * never throws - all errors are returned in the Effect error channel.
 * 
 * This is the specialized version for byte array inputs. For more flexible
 * input handling, use {@link from} which accepts strings, numbers, and bigints.
 * 
 * @param bytes - A Uint8Array that must be exactly 20 bytes long.
 * @returns An Effect that yields AddressType on success, or fails with
 *   InvalidAddressLengthError if the byte array is not exactly 20 bytes.
 * 
 * @example Basic usage
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const bytes = new Uint8Array(20).fill(0xab)
 * const addr = await Effect.runPromise(Address.fromBytes(bytes))
 * ```
 * 
 * @example Converting from hex to bytes first
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * import { Hex } from '@tevm/voltaire/Hex'
 * 
 * const bytes = Hex.toBytes('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * const addr = await Effect.runPromise(Address.fromBytes(bytes))
 * ```
 * 
 * @example Error handling for wrong length
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const result = await Effect.runPromiseExit(
 *   Address.fromBytes(new Uint8Array(19)) // Wrong length!
 * )
 * if (result._tag === 'Failure') {
 *   // InvalidAddressLengthError: expected 20 bytes, got 19
 * }
 * ```
 * 
 * @example Chaining with other Effects
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const program = Effect.gen(function* () {
 *   const bytes = yield* fetchAddressBytes()
 *   const addr = yield* Address.fromBytes(bytes)
 *   return Address.toChecksummed(addr)
 * })
 * ```
 * 
 * @error {InvalidAddressLengthError} When the byte array is not exactly 20 bytes.
 *   The error includes the actual length received.
 * 
 * @see {@link from} for flexible input format handling
 * @see {@link AddressFromBytesSchema} for Schema-based validation
 * @see {@link toBytes} for the inverse operation
 * 
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<AddressType, InvalidAddressLengthError> =>
  Effect.try({
    try: () => Address.fromBytes(bytes),
    catch: (e) => e as InvalidAddressLengthError
  })
