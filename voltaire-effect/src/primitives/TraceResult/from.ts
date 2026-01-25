import { TraceResult } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Result of an EVM execution trace.
 * @since 0.0.1
 */
type TraceResultType = {
  readonly gas: bigint
  readonly failed: boolean
  readonly returnValue: Uint8Array
  readonly structLogs?: readonly any[]
  readonly callTrace?: any
}

/**
 * Error thrown when trace result creation fails.
 * 
 * @example
 * ```typescript
 * import { TraceResultError } from './from.js'
 * 
 * const error = new TraceResultError('Invalid trace data', originalError)
 * console.log(error._tag) // 'TraceResultError'
 * ```
 * 
 * @since 0.0.1
 */
export class TraceResultError extends Error {
  /** Discriminant tag for error identification */
  readonly _tag = 'TraceResultError'
  
  /**
   * Creates a new TraceResultError.
   * @param message - Error description
   * @param cause - Original error that caused this failure
   */
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'TraceResultError'
  }
}

/**
 * Input type for creating trace results.
 * @since 0.0.1
 */
export type TraceResultInput = {
  /** Total gas consumed */
  gas: bigint
  /** Whether execution failed */
  failed: boolean
  /** Return data from execution */
  returnValue: Uint8Array
  /** Structured execution logs */
  structLogs?: readonly any[]
  /** Call trace tree */
  callTrace?: any
}

/**
 * Creates a validated TraceResult from trace data.
 * 
 * Wraps EVM execution trace output into a validated structure.
 * 
 * @param data - Raw trace result data
 * @returns Effect containing the validated TraceResult or TraceResultError
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from './from.js'
 * 
 * const result = await Effect.runPromise(from({
 *   gas: 21000n,
 *   failed: false,
 *   returnValue: new Uint8Array([])
 * }))
 * ```
 * 
 * @since 0.0.1
 */
export const from = (data: TraceResultInput): Effect.Effect<TraceResultType, TraceResultError> =>
  Effect.try({
    try: () => TraceResult.from(data as any) as TraceResultType,
    catch: (e) => new TraceResultError(
      e instanceof Error ? e.message : String(e),
      e
    )
  })
