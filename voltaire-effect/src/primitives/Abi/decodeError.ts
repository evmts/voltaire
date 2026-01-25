/**
 * @fileoverview Decodes error data using ABI.
 * Provides Effect-based wrapper for decoding error parameters.
 *
 * @module Abi/decodeError
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Error as AbiError, AbiItemNotFoundError, type AbiDecodingError, type AbiInvalidSelectorError } from '@tevm/voltaire/Abi'
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
 * Decodes error data using ABI.
 *
 * @description
 * Decodes error data by matching the 4-byte selector and decoding parameters.
 * Returns the error name and decoded parameters.
 *
 * @param {AbiInput} abi - The contract ABI.
 * @param {string} errorName - The error name to decode as.
 * @param {HexType | Uint8Array} data - The encoded error data.
 * @returns {Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError | AbiInvalidSelectorError>}
 *   Effect yielding the decoded error parameters.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeError } from 'voltaire-effect/primitives/Abi'
 *
 * const params = await Effect.runPromise(
 *   decodeError(abi, 'InsufficientBalance', '0x...')
 * )
 * ```
 *
 * @since 0.0.1
 */
export const decodeError = (
  abi: AbiInput,
  errorName: string,
  data: HexType | Uint8Array
): Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError | AbiInvalidSelectorError> =>
  Effect.try({
    try: () => {
      const bytes = typeof data === 'string' ? Hex.toBytes(data) : data
      const err = abi.find(item => item.type === 'error' && item.name === errorName)
      if (!err) {
        throw new AbiItemNotFoundError(`Error "${errorName}" not found in ABI`, {
          value: errorName,
          expected: 'valid error name in ABI',
          context: { errorName, abi }
        })
      }
      return AbiError.decodeParams(err as AbiError.ErrorType, bytes)
    },
    catch: (e) => e as AbiItemNotFoundError | AbiDecodingError | AbiInvalidSelectorError
  })
