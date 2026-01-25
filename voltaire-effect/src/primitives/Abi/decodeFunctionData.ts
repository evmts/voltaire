import * as Effect from 'effect/Effect'
import { decodeFunction, type AbiDecodingError, type AbiInvalidSelectorError, type AbiItemNotFoundError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'

type AbiInput = Parameters<typeof decodeFunction>[0]

/**
 * Decodes function call data using the provided ABI.
 * Extracts function name and decoded parameters from calldata.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing function definitions
 * @param data - The encoded function calldata as hex string or bytes
 * @returns Effect yielding function name and decoded parameters, or failing with decoding errors
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeFunctionData } from 'voltaire-effect/primitives/Abi'
 * 
 * const result = await Effect.runPromise(decodeFunctionData(abi, '0xa9059cbb...'))
 * console.log(result.name, result.params)
 * ```
 * 
 * @since 0.0.1
 */
export const decodeFunctionData = (
  abi: AbiInput,
  data: HexType | Uint8Array
): Effect.Effect<{ name: string; params: readonly unknown[] }, AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError> =>
  Effect.try({
    try: () => decodeFunction(abi, data),
    catch: (e) => e as AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
  })
