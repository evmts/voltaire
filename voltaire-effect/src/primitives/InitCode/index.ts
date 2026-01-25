/**
 * InitCode module for working with contract initialization bytecode in Effect.
 * Init code is the bytecode used during contract deployment, containing constructor
 * logic and the runtime bytecode to be stored on-chain.
 *
 * @example
 * ```typescript
 * import * as InitCode from 'voltaire-effect/InitCode'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Using the Effect-based constructor
 * const effect = InitCode.from('0x608060405234801561001057600080fd5b50')
 * const initCode = Effect.runSync(effect)
 *
 * // Using the Schema for validation
 * const parsed = S.decodeSync(InitCode.Schema)('0x6080604052')
 * ```
 *
 * @since 0.0.1
 * @module
 */
export { Schema } from './InitCodeSchema.js'
export { from } from './from.js'

/**
 * The branded type representing validated initialization code.
 * @since 0.0.1
 */
export type { InitCodeType } from '@tevm/voltaire/InitCode'
