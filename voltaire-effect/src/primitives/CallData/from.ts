import { Hex as VoltaireHex } from '@tevm/voltaire/Hex'
import type { CallDataType } from './CallDataSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Creates CallData from a hex string.
 *
 * @param value - Hex string representing call data (must start with '0x')
 * @returns Effect yielding CallDataType or failing with Error
 * @example
 * ```typescript
 * import * as CallData from 'voltaire-effect/CallData'
 * import { Effect } from 'effect'
 *
 * const program = CallData.from('0xa9059cbb...')
 * const result = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: string): Effect.Effect<CallDataType, Error> =>
  Effect.try({
    try: () => VoltaireHex(value) as CallDataType,
    catch: (e) => e as Error
  })

/**
 * Creates empty call data (0x).
 *
 * @returns Empty CallData value
 * @example
 * ```typescript
 * import * as CallData from 'voltaire-effect/CallData'
 *
 * const emptyData = CallData.empty()
 * ```
 * @since 0.0.1
 */
export const empty = (): CallDataType => VoltaireHex('0x') as CallDataType
