/**
 * RevertReason module for Effect-based EVM revert reason parsing.
 *
 * Provides Effect-wrapped operations for parsing and handling EVM revert
 * reasons including Error(string), Panic(uint256), and custom errors.
 *
 * @example
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const reason = yield* RevertReason.from(revertData)
 *
 *   switch (reason.type) {
 *     case 'Error':
 *       console.log('Revert:', reason.message)
 *       break
 *     case 'Panic':
 *       console.log('Panic code:', reason.code)
 *       break
 *     case 'Custom':
 *       console.log('Custom error:', reason.selector)
 *       break
 *   }
 * })
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { Schema, RevertReasonTypeSchema, type RevertReasonType, type ErrorRevertReason, type PanicRevertReason, type CustomRevertReason, type UnknownRevertReason } from './RevertReasonSchema.js'
export { from, toString, RevertReasonError } from './from.js'
