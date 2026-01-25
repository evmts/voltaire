import { TraceResult } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Result of an EVM execution trace.
 * Contains gas usage, execution status, and optional structured logs or call traces.
 * @since 0.0.1
 */
type TraceResultType = {
  /** Total gas consumed by the execution */
  readonly gas: bigint
  /** Whether the execution failed/reverted */
  readonly failed: boolean
  /** Return data from the execution */
  readonly returnValue: Uint8Array
  /** Structured logs from step-by-step execution (when using structLog tracer) */
  readonly structLogs?: readonly any[]
  /** Call trace tree (when using callTracer) */
  readonly callTrace?: any
}

/**
 * Internal schema declaration for TraceResult type validation.
 * @since 0.0.1
 */
const TraceResultTypeSchema = S.declare<TraceResultType>(
  (u): u is TraceResultType =>
    typeof u === 'object' && u !== null && 'gas' in u && 'failed' in u && 'returnValue' in u,
  { identifier: 'TraceResult' }
)

/**
 * Effect Schema for validating and transforming EVM trace results.
 * 
 * Transforms raw trace result data into a validated TraceResult object.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TraceResultSchema } from './TraceResultSchema.js'
 * 
 * const result = Schema.decodeSync(TraceResultSchema)({
 *   gas: 21000n,
 *   failed: false,
 *   returnValue: new Uint8Array([])
 * })
 * ```
 * 
 * @since 0.0.1
 */
export const TraceResultSchema: S.Schema<TraceResultType, {
  gas: bigint
  failed: boolean
  returnValue: Uint8Array
  structLogs?: readonly any[]
  callTrace?: any
}> = S.transformOrFail(
  S.Struct({
    gas: S.BigIntFromSelf,
    failed: S.Boolean,
    returnValue: S.Uint8ArrayFromSelf,
    structLogs: S.optional(S.Array(S.Any)),
    callTrace: S.optional(S.Any)
  }),
  TraceResultTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(TraceResult.from(value as any) as TraceResultType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (result) => ParseResult.succeed({
      gas: result.gas,
      failed: result.failed,
      returnValue: result.returnValue,
      structLogs: result.structLogs,
      callTrace: result.callTrace
    })
  }
).annotations({ identifier: 'TraceResultSchema' })
