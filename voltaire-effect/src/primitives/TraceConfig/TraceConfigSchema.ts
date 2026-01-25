import { TraceConfig } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Configuration options for EVM execution tracing.
 * Used with debug_traceTransaction and debug_traceCall RPC methods.
 * @since 0.0.1
 */
type TraceConfigType = {
  /** Disable storage capture during tracing */
  readonly disableStorage?: boolean
  /** Disable stack capture during tracing */
  readonly disableStack?: boolean
  /** Disable memory capture during tracing */
  readonly disableMemory?: boolean
  /** Enable memory capture during tracing */
  readonly enableMemory?: boolean
  /** Enable return data capture during tracing */
  readonly enableReturnData?: boolean
  /** Name of the tracer to use (e.g., 'callTracer', 'prestateTracer') */
  readonly tracer?: string
  /** Tracer execution timeout (e.g., '10s') */
  readonly timeout?: string
  /** Additional tracer-specific configuration */
  readonly tracerConfig?: Record<string, unknown>
}

/**
 * Internal schema declaration for TraceConfig type validation.
 * @since 0.0.1
 */
const TraceConfigTypeSchema = S.declare<TraceConfigType>(
  (u): u is TraceConfigType => typeof u === 'object' && u !== null,
  { identifier: 'TraceConfig' }
)

/**
 * Effect Schema for validating and transforming trace configuration options.
 * 
 * Used to configure how EVM execution traces are captured and formatted.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { TraceConfigSchema } from './TraceConfigSchema.js'
 * 
 * const config = Schema.decodeSync(TraceConfigSchema)({
 *   tracer: 'callTracer',
 *   timeout: '10s',
 *   tracerConfig: { onlyTopCall: true }
 * })
 * ```
 * 
 * @since 0.0.1
 */
export const TraceConfigSchema: S.Schema<TraceConfigType, {
  disableStorage?: boolean
  disableStack?: boolean
  disableMemory?: boolean
  enableMemory?: boolean
  enableReturnData?: boolean
  tracer?: string
  timeout?: string
  tracerConfig?: Record<string, unknown>
}> = S.transformOrFail(
  S.Struct({
    disableStorage: S.optional(S.Boolean),
    disableStack: S.optional(S.Boolean),
    disableMemory: S.optional(S.Boolean),
    enableMemory: S.optional(S.Boolean),
    enableReturnData: S.optional(S.Boolean),
    tracer: S.optional(S.String),
    timeout: S.optional(S.String),
    tracerConfig: S.optional(S.Record({ key: S.String, value: S.Unknown }))
  }),
  TraceConfigTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(TraceConfig.from(value) as TraceConfigType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (config) => ParseResult.succeed({
      disableStorage: config.disableStorage,
      disableStack: config.disableStack,
      disableMemory: config.disableMemory,
      enableMemory: config.enableMemory,
      enableReturnData: config.enableReturnData,
      tracer: config.tracer,
      timeout: config.timeout,
      tracerConfig: config.tracerConfig
    })
  }
).annotations({ identifier: 'TraceConfigSchema' })
