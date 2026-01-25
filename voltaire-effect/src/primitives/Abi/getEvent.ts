/**
 * @fileoverview Retrieves event definitions from Ethereum ABI.
 * Provides Effect-based wrapper for looking up event ABI items by name.
 *
 * @module Abi/getEvent
 * @since 0.0.1
 */

import * as Effect from 'effect/Effect'
import { Item, AbiItemNotFoundError, Event as AbiEvent } from '@tevm/voltaire/Abi'

/**
 * Type alias for ABI input accepted by the lookup function.
 * @internal
 */
type AbiInput = Parameters<typeof Item.getItem>[0]

/**
 * Retrieves an event definition from an ABI by name.
 *
 * @description
 * Looks up an event in the provided ABI by its name and returns the full
 * event definition including input parameters, indexed flags, and other
 * metadata. This is useful for programmatically working with events,
 * such as building log filters or decoding event parameters.
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with `AbiItemNotFoundError` if no event with the given
 * name exists in the ABI.
 *
 * @param {AbiInput} abi - The contract ABI containing event definitions.
 *   Can be a JSON ABI array or parsed ABI object.
 * @param {string} name - The name of the event to retrieve.
 *   Must exactly match an event name in the ABI (case-sensitive).
 *
 * @returns {Effect.Effect<AbiEvent.EventType, AbiItemNotFoundError>}
 *   Effect yielding the event definition object containing:
 *   - `type`: 'event'
 *   - `name`: The event name
 *   - `inputs`: Array of input parameters with types and indexed flags
 *   Or failing with `AbiItemNotFoundError` if event not found.
 *
 * @throws {AbiItemNotFoundError} When no event with the given name exists in the ABI.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { getEvent } from 'voltaire-effect/primitives/Abi'
 *
 * const erc20Abi = [
 *   {
 *     type: 'event',
 *     name: 'Transfer',
 *     inputs: [
 *       { name: 'from', type: 'address', indexed: true },
 *       { name: 'to', type: 'address', indexed: true },
 *       { name: 'value', type: 'uint256', indexed: false }
 *     ]
 *   }
 * ]
 *
 * const transferEvent = await Effect.runPromise(getEvent(erc20Abi, 'Transfer'))
 * console.log(transferEvent.inputs)
 * // [{ name: 'from', type: 'address', indexed: true }, ...]
 * ```
 *
 * @example
 * ```typescript
 * // Build a log filter from event definition
 * const event = await Effect.runPromise(getEvent(abi, 'Transfer'))
 * const signature = keccak256(
 *   `${event.name}(${event.inputs.map(i => i.type).join(',')})`
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Handle missing events
 * const event = await Effect.runPromise(
 *   getEvent(abi, 'MaybeEvent').pipe(
 *     Effect.catchTag('AbiItemNotFoundError', () =>
 *       Effect.succeed(null)
 *     )
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link decodeEventLog} for decoding event log data
 * @see {@link getFunction} for retrieving function definitions
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
