import * as Effect from 'effect/Effect'
import { Function as AbiFunction, AbiItemNotFoundError, type AbiDecodingError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'
import * as Hex from '@tevm/voltaire/Hex'

type AbiItem = { type: string; name?: string }
type AbiInput = readonly AbiItem[]

/**
 * Decodes the return value of a function call using the provided ABI.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing function definitions
 * @param functionName - The name of the function whose result to decode
 * @param data - The encoded return data as hex string or bytes
 * @returns Effect yielding decoded return values array, or failing with decoding errors
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeFunctionResult } from 'voltaire-effect/primitives/Abi'
 * 
 * const result = await Effect.runPromise(
 *   decodeFunctionResult(abi, 'balanceOf', returnData)
 * )
 * console.log(result[0]) // balance
 * ```
 * 
 * @since 0.0.1
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
