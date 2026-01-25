import * as Effect from 'effect/Effect'
import { Item, AbiItemNotFoundError, Event as AbiEvent } from '@tevm/voltaire/Abi'

type AbiInput = Parameters<typeof Item.getItem>[0]

/**
 * Retrieves an event definition from an ABI by name.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing event definitions
 * @param name - The name of the event to retrieve
 * @returns Effect yielding the event definition, or failing with AbiItemNotFoundError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getEvent } from 'voltaire-effect/primitives/Abi'
 * 
 * const transferEvent = await Effect.runPromise(getEvent(abi, 'Transfer'))
 * console.log(transferEvent.inputs)
 * ```
 * 
 * @since 0.0.1
 */
export const getEvent = (
  abi: AbiInput,
  name: string
): Effect.Effect<AbiEvent.EventType, AbiItemNotFoundError> =>
  Effect.try({
    try: () => {
      const item = Item.getItem(abi, name, 'event')
      if (!item) {
        const error = new AbiItemNotFoundError(`Event "${name}" not found in ABI`, {
          value: name,
          expected: 'valid event name in ABI',
          context: { name, abi }
        })
        throw error
      }
      return item as AbiEvent.EventType
    },
    catch: (e) => e as AbiItemNotFoundError
  })
