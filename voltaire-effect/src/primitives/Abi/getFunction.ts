import * as Effect from 'effect/Effect'
import { Item, AbiItemNotFoundError, Function as AbiFunction } from '@tevm/voltaire/Abi'

type AbiInput = Parameters<typeof Item.getItem>[0]

/**
 * Retrieves a function definition from an ABI by name.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing function definitions
 * @param name - The name of the function to retrieve
 * @returns Effect yielding the function definition, or failing with AbiItemNotFoundError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getFunction } from 'voltaire-effect/primitives/Abi'
 * 
 * const transferFn = await Effect.runPromise(getFunction(abi, 'transfer'))
 * console.log(transferFn.inputs, transferFn.outputs)
 * ```
 * 
 * @since 0.0.1
 */
export const getFunction = (
  abi: AbiInput,
  name: string
): Effect.Effect<AbiFunction.FunctionType, AbiItemNotFoundError> =>
  Effect.try({
    try: () => {
      const item = Item.getItem(abi, name, 'function')
      if (!item) {
        const error = new AbiItemNotFoundError(`Function "${name}" not found in ABI`, {
          value: name,
          expected: 'valid function name in ABI',
          context: { name, abi }
        })
        throw error
      }
      return item as AbiFunction.FunctionType
    },
    catch: (e) => e as AbiItemNotFoundError
  })
