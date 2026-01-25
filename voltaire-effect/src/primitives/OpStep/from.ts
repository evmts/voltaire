import { OpStep } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type representing a single EVM execution step.
 * @since 0.0.1
 */
type OpStepType = ReturnType<typeof OpStep.from>

/**
 * Input parameters for OpStep creation.
 * @since 0.0.1
 */
type OpStepInput = Parameters<typeof OpStep.from>[0]

/**
 * Error thrown when OpStep creation fails.
 *
 * @example
 * ```typescript
 * import { OpStepError } from 'voltaire-effect/primitives/OpStep'
 *
 * const error = new OpStepError('Invalid program counter')
 * console.log(error._tag) // 'OpStepError'
 * ```
 *
 * @since 0.0.1
 */
export class OpStepError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'OpStepError'
  /**
   * Creates a new OpStepError.
   * @param message - Error description
   * @param cause - Optional underlying cause
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'OpStepError'
  }
}

/**
 * Creates an OpStep from execution data using Effect for error handling.
 *
 * @param value - OpStep input containing pc, op, gas, gasCost, depth, and optional stack/memory/storage
 * @returns Effect that succeeds with the OpStep or fails with OpStepError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/OpStep'
 *
 * const step = from({
 *   pc: 0,
 *   op: 0x60, // PUSH1
 *   gas: 100000n,
 *   gasCost: 3n,
 *   depth: 1
 * })
 *
 * Effect.runSync(step) // OpStep
 * ```
 *
 * @since 0.0.1
 */
export function from(value: OpStepInput): Effect.Effect<OpStepType, OpStepError> {
  return Effect.try({
    try: () => OpStep.from(value),
    catch: (e) => new OpStepError((e as Error).message, e)
  })
}
