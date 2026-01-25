/**
 * @fileoverview Encodes Ethereum function call data (calldata) using ABI definitions.
 * Provides Effect-based wrapper for creating encoded calldata for contract calls.
 *
 * @module Abi/encodeFunctionData
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { encodeFunction, type AbiItemNotFoundError, type AbiEncodingError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'

/**
 * Type alias for ABI input accepted by the encoder.
 * @internal
 */
type AbiInput = Parameters<typeof encodeFunction>[0]

/**
 * Encodes function call data using the provided ABI.
 *
 * @description
 * Creates encoded calldata for invoking a contract function. The result
 * is a hex string consisting of a 4-byte function selector followed by
 * ABI-encoded arguments. This calldata can be used directly in a transaction
 * or `eth_call` request.
 *
 * This function never throws exceptions. Instead, it returns an Effect that
 * may fail with typed errors if the function is not found or arguments
 * cannot be encoded.
 *
 * @param {AbiInput} abi - The contract ABI containing function definitions.
 *   Can be a JSON ABI array or parsed ABI object.
 * @param {string} functionName - The name of the function to encode.
 *   Must exactly match a function name in the ABI.
 * @param {readonly unknown[]} args - The function arguments to encode.
 *   Must match the function's input types in order.
 *
 * @returns {Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError>}
 *   Effect yielding encoded calldata as hex string starting with '0x'.
 *   Or failing with:
 *   - `AbiItemNotFoundError`: Function not found in ABI
 *   - `AbiEncodingError`: Failed to encode the arguments
 *
 * @throws {AbiItemNotFoundError} When the function name is not found in the ABI.
 * @throws {AbiEncodingError} When argument encoding fails (wrong types, invalid values).
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeFunctionData } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'function',
 *     name: 'transfer',
 *     inputs: [
 *       { name: 'to', type: 'address' },
 *       { name: 'amount', type: 'uint256' }
 *     ],
 *     outputs: [{ type: 'bool' }]
 *   }
 * ]
 *
 * // Encode a transfer call
 * const calldata = await Effect.runPromise(
 *   encodeFunctionData(erc20Abi, 'transfer', [
 *     '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
 *     1000000000000000000n // 1 token
 *   ])
 * )
 * // Returns: 0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3...
 * ```
 *
 * @example
 * ```typescript
 * // Handle encoding errors
 * const calldata = await Effect.runPromise(
 *   encodeFunctionData(abi, 'unknownFn', []).pipe(
 *     Effect.catchTag('AbiItemNotFoundError', () =>
 *       Effect.fail(new Error('Function not found'))
 *     ),
 *     Effect.catchTag('AbiEncodingError', (e) =>
 *       Effect.fail(new Error(`Encoding failed: ${e.message}`))
 *     )
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Use with transaction sending
 * const calldata = await Effect.runPromise(
 *   encodeFunctionData(abi, 'approve', [spender, amount])
 * )
 * const tx = { to: tokenAddress, data: calldata }
 * ```
 *
 * @since 0.0.1
 * @see {@link decodeFunctionData} for decoding function calldata
 * @see {@link decodeFunctionResult} for decoding return values
 * @see {@link getFunction} for retrieving function definitions by name
 */
export const encodeFunctionData = (
  abi: AbiInput,
  functionName: string,
  args: readonly unknown[]
): Effect.Effect<HexType, AbiItemNotFoundError | AbiEncodingError> =>
  Effect.try({
    try: () => encodeFunction(abi, functionName, args),
    catch: (e) => e as AbiItemNotFoundError | AbiEncodingError
  })
