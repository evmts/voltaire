/**
 * TraceResult module for representing EVM execution trace results.
 * 
 * Contains the output of debug_traceTransaction and debug_traceCall RPC methods,
 * including gas usage, execution status, and optional trace data.
 * 
 * @example
 * ```typescript
 * import * as TraceResult from './index.js'
 * import * as Effect from 'effect/Effect'
 * 
 * const result = await Effect.runPromise(TraceResult.from({
 *   gas: 21000n,
 *   failed: false,
 *   returnValue: new Uint8Array([])
 * }))
 * ```
 * 
 * @module TraceResult
 * @since 0.0.1
 */
export { TraceResultSchema } from './TraceResultSchema.js'
export { from, TraceResultError, type TraceResultInput } from './from.js'
