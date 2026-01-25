import * as Effect from 'effect/Effect'
import { decodeLog, type AbiItemNotFoundError } from '@tevm/voltaire/Abi'
import type { HexType } from '@tevm/voltaire/Hex'

type AbiInput = Parameters<typeof decodeLog>[0]

/**
 * Input structure for decoding event logs.
 * 
 * @since 0.0.1
 */
export interface LogInput {
  /** The log data as hex string or bytes */
  data: HexType | Uint8Array
  /** Array of log topics as hex strings or bytes */
  topics: readonly (HexType | Uint8Array)[]
}

/**
 * Decodes an event log using the provided ABI.
 * Never throws - returns Effect with error in channel.
 * 
 * @param abi - The contract ABI containing event definitions
 * @param log - The log data with topics to decode
 * @returns Effect yielding decoded event name and parameters, or failing with AbiItemNotFoundError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decodeEventLog } from 'voltaire-effect/primitives/Abi'
 * 
 * const result = await Effect.runPromise(decodeEventLog(abi, {
 *   data: '0x...',
 *   topics: ['0x...', '0x...']
 * }))
 * console.log(result.event, result.params)
 * ```
 * 
 * @since 0.0.1
 */
export const decodeEventLog = (
  abi: AbiInput,
  log: LogInput
): Effect.Effect<{ event: string; params: Record<string, unknown> }, AbiItemNotFoundError> =>
  Effect.try({
    try: () => decodeLog(abi, log),
    catch: (e) => e as AbiItemNotFoundError
  })
