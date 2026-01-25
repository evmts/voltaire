/**
 * @fileoverview Encodes error data with selector.
 * Provides Effect-based wrapper for encoding error parameters.
 *
 * @module Abi/encodeError
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Error as AbiError, AbiItemNotFoundError, type AbiEncodingError } from '@tevm/voltaire/Abi'
import * as Hex from '@tevm/voltaire/Hex'
import type { HexType } from '@tevm/voltaire/Hex'

/**
 * Represents a single ABI item.
 * @internal
 */
type AbiItem = { type: string; name?: string }

/**
 * Type alias for ABI input.
 * @internal
 */
type AbiInput = readonly AbiItem[]

/**
 * Encodes error data with selector.
 *
 * @description
 * Encodes error parameters with a 4-byte selector prefix.
 * The selector is the first 4 bytes of keccak256(signature).
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} errorName - The error name.
 * @param {readonly unknown[]} args - The error parameters.
 * @returns {Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding the encoded error data.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeError } from 'voltaire-effect/primitives/Abi'
 *
 * const encoded = await Effect.runPromise(
 *   encodeError(abi, 'InsufficientBalance', [100n])
 * )
 * ```
 *
 * @since 0.0.1
 */
export const encodeError = (
  abi: AbiInput,
  errorName: string,
  args: readonly unknown[]
): Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError> =>
  Effect.try({
    try: () => {
      const err = abi.find(item => item.type === 'error' && item.name === errorName)
      if (!err) {
        throw new AbiItemNotFoundError(`Error "${errorName}" not found in ABI`, {
          value: errorName,
          expected: 'valid error name in ABI',
          context: { errorName, abi }
        })
      }
      const encoded = AbiError.encodeParams(err as AbiError.ErrorType, args as never)
      return Hex.fromBytes(encoded)
    },
    catch: (e) => e as AbiItemNotFoundError | AbiEncodingError
  })
