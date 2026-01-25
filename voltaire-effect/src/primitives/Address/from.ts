/**
 * @fileoverview Effect-based address creation from multiple input formats.
 * Provides a safe, never-throwing function that returns errors in the Effect channel.
 * 
 * @module from
 * @since 0.0.1
 */

import { Address, type AddressType, InvalidAddressError } from '@tevm/voltaire/Address'
import { ValidationError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates an Address from various input formats.
 * 
 * @description
 * This function accepts multiple input formats and converts them to an
 * AddressType. Unlike the direct Voltaire `Address()` constructor, this
 * function never throws - all errors are returned in the Effect error channel.
 * 
 * Supported input formats:
 * - **string**: Hex string with "0x" prefix (e.g., "0x742d35Cc...")
 * - **Uint8Array**: 20-byte array
 * - **number**: Numeric value (converted to 20-byte address)
 * - **bigint**: BigInt value (converted to 20-byte address)
 * 
 * @param value - The value to convert to an address. Can be a hex string,
 *   byte array, number, or bigint.
 * @returns An Effect that yields AddressType on success, or fails with
 *   InvalidAddressError if the input is not a valid address.
 * 
 * @example Basic usage with hex string
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const addr = await Effect.runPromise(
 *   Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')
 * )
 * ```
 * 
 * @example From bytes
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const bytes = new Uint8Array(20).fill(0xab)
 * const addr = await Effect.runPromise(Address.from(bytes))
 * ```
 * 
 * @example From bigint
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const addr = await Effect.runPromise(Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n))
 * ```
 * 
 * @example Error handling
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const result = await Effect.runPromiseExit(Address.from('invalid'))
 * if (result._tag === 'Failure') {
 *   console.error(result.cause) // InvalidAddressError
 * }
 * ```
 * 
 * @example Pattern matching on result
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Match from 'effect/Match'
 * import * as Address from 'voltaire-effect/primitives/Address'
 * 
 * const program = Address.from(input).pipe(
 *   Effect.matchEffect({
 *     onFailure: (e) => Effect.succeed(`Invalid: ${e.message}`),
 *     onSuccess: (addr) => Effect.succeed(`Valid: ${Address.toHex(addr)}`)
 *   })
 * )
 * ```
 * 
 * @error {InvalidAddressError} When the input cannot be converted to a valid
 *   Ethereum address. Common reasons include:
 *   - Invalid hex format (missing prefix, wrong characters)
 *   - Wrong byte length (not 20 bytes)
 *   - Value out of range for address space
 * 
 * @see {@link AddressSchema} for Schema-based validation
 * @see {@link fromBytes} for byte-array specific conversion
 * @see {@link toBytes} for converting back to bytes
 * 
 * @since 0.0.1
 */
export const from = (value: number | bigint | string | Uint8Array): Effect.Effect<AddressType, InvalidAddressError> =>
  Effect.try({
    try: () => Address(value),
    catch: (e) => {
      if (e instanceof InvalidAddressError) return e
      if (e instanceof ValidationError) {
        return new InvalidAddressError(e.message, { value, expected: 'valid address', cause: e })
      }
      return new InvalidAddressError(
        e instanceof Error ? e.message : String(e),
        { value, expected: 'valid address', cause: e instanceof Error ? e : undefined }
      )
    }
  })
