import { Uint } from '@tevm/voltaire'
import type { GasType } from './GasSchema.js'
import type { UintError } from '../Uint/from.js'
import * as Effect from 'effect/Effect'

/**
 * Creates a Gas value from a numeric input.
 * @param value - Gas amount as bigint, number, or string
 * @returns Effect containing GasType or UintError
 * @example
 * ```ts
 * import * as Gas from 'voltaire-effect/primitives/Gas'
 *
 * const gas = Gas.from(21000n)
 * const gasFromString = Gas.from('21000')
 * ```
 * @since 0.0.1
 */
export const from = (value: bigint | number | string): Effect.Effect<GasType, UintError> =>
  Effect.try({
    try: () => Uint.from(value) as unknown as GasType,
    catch: (e) => e as UintError
  })
