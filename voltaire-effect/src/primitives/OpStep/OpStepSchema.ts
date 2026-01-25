import { OpStep } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a single EVM execution step with full debug information.
 * @since 0.0.1
 */
type OpStepType = ReturnType<typeof OpStep.from>

const OpStepTypeSchema = S.declare<OpStepType>(
  (u): u is OpStepType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    return (
      typeof obj.pc === 'number' &&
      typeof obj.op === 'number' &&
      typeof obj.gas === 'bigint' &&
      typeof obj.gasCost === 'bigint' &&
      typeof obj.depth === 'number'
    )
  },
  { identifier: 'OpStep' }
)

/**
 * Input parameters for creating an OpStep.
 * @since 0.0.1
 */
type OpStepInput = {
  /** Program counter position */
  pc: number
  /** Opcode being executed */
  op: number
  /** Remaining gas */
  gas: bigint
  /** Cost of this operation */
  gasCost: bigint
  /** Call stack depth */
  depth: number
  /** Optional EVM stack state */
  stack?: readonly bigint[]
  /** Optional memory state */
  memory?: Uint8Array
  /** Optional storage state */
  storage?: Record<string, bigint>
  /** Optional error message if step failed */
  error?: string
}

/**
 * Effect Schema for validating and transforming EVM operation steps.
 *
 * Transforms OpStep input data into a validated OpStepType.
 * Used for tracing and debugging EVM execution.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { OpStepSchema } from 'voltaire-effect/primitives/OpStep'
 *
 * const step = S.decodeSync(OpStepSchema)({
 *   pc: 0,
 *   op: 0x60, // PUSH1
 *   gas: 100000n,
 *   gasCost: 3n,
 *   depth: 1,
 *   stack: [1n, 2n, 3n]
 * })
 * ```
 *
 * @since 0.0.1
 */
export const OpStepSchema: S.Schema<OpStepType, OpStepInput> = S.transformOrFail(
  S.Struct({
    pc: S.Number,
    op: S.Number,
    gas: S.BigIntFromSelf,
    gasCost: S.BigIntFromSelf,
    depth: S.Number,
    stack: S.optional(S.Array(S.BigIntFromSelf)),
    memory: S.optional(S.Uint8ArrayFromSelf),
    storage: S.optional(S.Record({ key: S.String, value: S.BigIntFromSelf })),
    error: S.optional(S.String)
  }),
  OpStepTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(OpStep.from(value as Parameters<typeof OpStep.from>[0]))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (opStep) => ParseResult.succeed({
      pc: opStep.pc,
      op: opStep.op as number,
      gas: opStep.gas as bigint,
      gasCost: opStep.gasCost as bigint,
      depth: opStep.depth,
      ...(opStep.stack !== undefined && { stack: opStep.stack as readonly bigint[] }),
      ...(opStep.memory !== undefined && { memory: opStep.memory }),
      ...(opStep.storage !== undefined && { storage: opStep.storage as Record<string, bigint> }),
      ...(opStep.error !== undefined && { error: opStep.error })
    })
  }
).annotations({ identifier: 'OpStepSchema' })
