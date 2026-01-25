import { from as voltaireFrom, type InitCodeType } from '@tevm/voltaire/InitCode'
import * as Effect from 'effect/Effect'

/**
 * Creates an InitCode from a Uint8Array or hex string, wrapped in an Effect.
 * Init code is the bytecode used to deploy smart contracts on the EVM.
 *
 * @param value - The init code as a Uint8Array or hex string (with or without 0x prefix)
 * @returns An Effect that resolves to InitCodeType or fails with an Error
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as InitCode from 'voltaire-effect/InitCode'
 *
 * // From hex string
 * const effect = InitCode.from('0x608060405234801561001057600080fd5b50')
 * const result = Effect.runSync(effect)
 *
 * // From Uint8Array
 * const bytes = new Uint8Array([0x60, 0x80, 0x60, 0x40])
 * const fromBytes = Effect.runSync(InitCode.from(bytes))
 * ```
 *
 * @since 0.0.1
 */
export const from = (value: Uint8Array | string): Effect.Effect<InitCodeType, Error> =>
  Effect.try({
    try: () => voltaireFrom(value),
    catch: (e) => e as Error
  })
