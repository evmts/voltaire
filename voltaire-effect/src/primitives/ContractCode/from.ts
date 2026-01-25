import { from as voltaireFrom, type ContractCodeType } from '@tevm/voltaire/ContractCode'
import * as Effect from 'effect/Effect'

/**
 * Creates ContractCode from bytecode.
 *
 * @param value - Contract bytecode as hex string or Uint8Array
 * @returns Effect yielding ContractCodeType or failing with Error
 * @example
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/ContractCode'
 * import { Effect } from 'effect'
 *
 * const program = ContractCode.from('0x608060405234801561001057600080fd5b50...')
 * const code = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (value: Uint8Array | string): Effect.Effect<ContractCodeType, Error> =>
  Effect.try({
    try: () => voltaireFrom(value),
    catch: (e) => e as Error
  })
