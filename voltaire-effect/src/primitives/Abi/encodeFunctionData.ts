import * as Effect from 'effect/Effect'
import { encodeFunction, type AbiItemNotFoundError, type AbiEncodingError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'

type AbiInput = Parameters<typeof encodeFunction>[0]

/**
 * Encodes function call data using the provided ABI.
 * Creates calldata for contract function invocation.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing function definitions
 * @param functionName - The name of the function to encode
 * @param args - The function arguments to encode
 * @returns Effect yielding encoded calldata as hex, or failing with encoding errors
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { encodeFunctionData } from 'voltaire-effect/primitives/Abi'
 * 
 * const calldata = await Effect.runPromise(
 *   encodeFunctionData(abi, 'transfer', [to, amount])
 * )
 * ```
 * 
 * @since 0.0.1
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
