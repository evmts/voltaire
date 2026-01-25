/**
 * @module StructLog
 *
 * Effect-based module for working with EVM execution trace logs.
 * StructLogs capture the state at each EVM opcode execution step.
 *
 * @example
 * ```typescript
 * import { StructLog } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const log = yield* StructLog.from({
 *     pc: 0,
 *     op: 'PUSH1',
 *     gas: 100000n,
 *     gasCost: 3n,
 *     depth: 1,
 *     stack: []
 *   })
 *   return log
 * })
 * ```
 *
 * @since 0.0.1
 */
export { StructLogSchema } from './StructLogSchema.js'
export { from, StructLogError, type StructLogInput } from './from.js'
