/**
 * @fileoverview Decodes Ethereum function return data using ABI definitions.
 * Provides Effect-based wrapper for parsing function call return values.
 *
 * @module Abi/decodeFunctionResult
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Function as AbiFunction, AbiItemNotFoundError, type AbiDecodingError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'
import * as Hex from '@tevm/voltaire/Hex'

/**
 * Represents a single ABI item with type and optional name.
 * @internal
 */
type AbiItem = { type: string; name?: string }

/**
 * Type alias for ABI input accepted by the decoder.
 * @internal
 */
type AbiInput = readonly AbiItem[]

/**
 * Decodes the return value of a function call using the provided ABI.
 *
 * @description
 * Parses the ABI-encoded return data from a contract call into an array of
 * decoded values. The function looks up the named function in the ABI to
 * determine the expected output types, then decodes the data accordingly.
 *
 * This is typically used after making an `eth_call` or similar RPC request
 * to interpret the raw bytes returned by the contract.
 *
 * This function never throws exceptions. Instead, it returns an Effect that
 * may fail with typed errors.
 *
 * @param {AbiInput} abi - The contract ABI containing function definitions.
 *   Must be an array of ABI items including the target function.
 * @param {string} functionName - The name of the function whose result to decode.
 *   Must exactly match a function name in the ABI.
 * @param {HexType | Uint8Array} data - The encoded return data as hex string or bytes.
 *   This is the raw data returned from the contract call.
 *
 * @returns {Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError>}
 *   Effect yielding an array of decoded return values in order.
 *   For functions with single return value, array has one element.
 *   For functions with multiple returns, array has multiple elements.
 *   Or failing with:
 *   - `AbiItemNotFoundError`: Function not found in ABI
 *   - `AbiDecodingError`: Failed to decode the return data
 *
 * @throws {AbiItemNotFoundError} When the function name is not found in the ABI.
 * @throws {AbiDecodingError} When return data decoding fails (wrong types, insufficient data).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeFunctionResult } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'balanceOf',
 *     inputs: [{ name: 'account', type: 'address' }],
 *     outputs: [{ type: 'uint256' }]
 *   }
 * ]
 *
 * // Decode balanceOf return value
 * const returnData = '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
 * const result = await Effect.runPromise(
 *   decodeFunctionResult(erc20Abi, 'balanceOf', returnData)
 * )
 * console.log(result[0]) // 1000000000000000000n (1 ETH in wei)
 * ```
 *
 * @example
 * ```typescript
 * // Function with multiple return values
 * const pairAbi = [
 *   {
 *     type: 'function',
 *     name: 'getReserves',
 *     inputs: [],
 *     outputs: [
 *       { name: 'reserve0', type: 'uint112' },
 *       { name: 'reserve1', type: 'uint112' },
 *       { name: 'blockTimestampLast', type: 'uint32' }
 *     ]
 *   }
 * ]
 *
 * const result = await Effect.runPromise(
 *   decodeFunctionResult(pairAbi, 'getReserves', returnData)
 * )
 * const [reserve0, reserve1, timestamp] = result
 * ```
 *
 * @example
 * ```typescript
 * // Handle errors gracefully
 * const decoded = await Effect.runPromise(
 *   decodeFunctionResult(abi, 'unknownFn', data).pipe(
 *     Effect.catchTag('AbiItemNotFoundError', () =>
 *       Effect.fail(new Error('Function not in ABI'))
 *     )
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link decodeFunctionData} for decoding function calldata
 * @see {@link encodeFunctionData} for encoding function calls
 */
export const decodeFunctionResult = (
  abi: AbiInput,
  functionName: string,
  data: HexType | Uint8Array
): Effect.Effect<readonly unknown[], AbiItemNotFoundError | AbiDecodingError> =>
  Effect.try({
    try: () => {
      const bytes = typeof data === 'string' ? Hex.toBytes(data) : data
      const fn = abi.find(item => item.type === 'function' && item.name === functionName)
      if (!fn) {
        throw new AbiItemNotFoundError(`Function "${functionName}" not found in ABI`, {
          value: functionName,
          expected: 'valid function name in ABI',
          context: { functionName, abi }
        })
      }
      return AbiFunction.decodeResult(fn as AbiFunction.FunctionType, bytes)
    },
    catch: (e) => e as AbiItemNotFoundError | AbiDecodingError
  })
