/**
 * OpStep module for Effect-based EVM execution step handling.
 *
 * Provides Effect-wrapped operations for working with EVM execution steps,
 * including program counter, opcode, gas, stack, memory, and storage state.
 *
 * @example
 * ```typescript
 * import * as OpStep from 'voltaire-effect/primitives/OpStep'
 * import * as Effect from 'effect/Effect'
 *
 * // Create an execution step
 * const step = OpStep.from({
 *   pc: 10,
 *   op: 0x01, // ADD
 *   gas: 50000n,
 *   gasCost: 3n,
 *   depth: 1,
 *   stack: [1n, 2n]
 * })
 *
 * Effect.runSync(step)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { OpStepSchema } from './OpStepSchema.js'
export { from, OpStepError } from './from.js'
