import { TraceConfig } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Configuration options for EVM execution tracing.
 * @since 0.0.1
 */
type TraceConfigType = {
  readonly disableStorage?: boolean
  readonly disableStack?: boolean
  readonly disableMemory?: boolean
  readonly enableMemory?: boolean
  readonly enableReturnData?: boolean
  readonly tracer?: string
  readonly timeout?: string
  readonly tracerConfig?: Record<string, unknown>
}

/**
 * Error thrown when trace configuration creation fails.
 * 
 * @example
 * ```typescript
 * import { TraceConfigError } from './from.js'
 * 
 * const error = new TraceConfigError('Invalid tracer name', originalError)
 * console.log(error._tag) // 'TraceConfigError'
 * ```
 * 
 * @since 0.0.1
 */
export class TraceConfigError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'TraceConfigError'
  
  /**
   * Creates a new TraceConfigError.
   * @param message - Error description
   * @param cause - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'TraceConfigError'
  }
}

/**
 * Input type for creating trace configurations.
 * @since 0.0.1
 */
export type TraceConfigInput = {
  /** Disable storage capture during tracing */
  disableStorage?: boolean
  /** Disable stack capture during tracing */
  disableStack?: boolean
  /** Disable memory capture during tracing */
  disableMemory?: boolean
  /** Enable memory capture during tracing */
  enableMemory?: boolean
  /** Enable return data capture during tracing */
  enableReturnData?: boolean
  /** Name of the tracer to use */
  tracer?: string
  /** Tracer execution timeout */
  timeout?: string
  /** Additional tracer-specific configuration */
  tracerConfig?: Record<string, unknown>
}

/**
 * Creates a validated TraceConfig from optional configuration options.
 * 
 * Used to configure EVM execution tracing for debug RPC methods.
 * 
 * @param config - Optional trace configuration options
 * @returns Effect containing the validated TraceConfig or TraceConfigError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const config = await Effect.runPromise(from({
 *   tracer: 'callTracer',
 *   tracerConfig: { onlyTopCall: true }
 * }))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (config?: TraceConfigInput): Effect.Effect<TraceConfigType, TraceConfigError> =>
  Effect.try({
    try: () => TraceConfig.from(config) as TraceConfigType,
    catch: (e) => new TraceConfigError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
