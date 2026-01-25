import { StructLog } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type StructLogType = {
  readonly pc: number
  readonly op: string
  readonly gas: bigint
  readonly gasCost: bigint
  readonly depth: number
  readonly stack: readonly string[]
  readonly memory?: readonly string[]
  readonly storage?: Record<string, string>
  readonly refund?: bigint
  readonly error?: string
}

/**
 * Error thrown when struct log creation fails.
 *
 * @example
 * ```typescript
 * import { StructLog } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(StructLog.from(invalidData)).catch(e => {
 *   if (e._tag === 'StructLogError') {
 *     console.error('StructLog error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StructLogError extends Error {
  readonly _tag = 'StructLogError'
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'StructLogError'
  }
}

/**
 * Input type for creating a StructLog.
 *
 * @since 0.0.1
 */
export type StructLogInput = {
  pc: number
  op: string
  gas: bigint
  gasCost: bigint
  depth: number
  stack: readonly string[]
  memory?: readonly string[]
  storage?: Record<string, string>
  refund?: bigint
  error?: string
}

/**
 * Creates a StructLog from execution trace data.
 * StructLogs capture the EVM state at each opcode execution step.
 *
 * @param {StructLogInput} data - The trace data
 * @returns {Effect.Effect<StructLogType, StructLogError>} Effect containing the StructLog or an error
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
export const from = (data: StructLogInput): Effect.Effect<StructLogType, StructLogError> =>
  Effect.try({
    try: () => StructLog.from(data as any) as StructLogType,
    catch: (e) => new StructLogError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
