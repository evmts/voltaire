/**
 * TraceConfig module for configuring EVM execution tracing.
 *
 * Provides configuration options for debug_traceTransaction and debug_traceCall
 * RPC methods, controlling what data is captured during trace execution.
 *
 * @example
 * ```typescript
 * import * as TraceConfig from './index.js'
 * import * as Effect from 'effect/Effect'
 *
 * const config = await Effect.runPromise(TraceConfig.from({
 *   tracer: 'callTracer',
 *   timeout: '10s'
 * }))
 * ```
 *
 * @module TraceConfig
 * @since 0.0.1
 */

export { TraceConfigSchema } from "./TraceConfigSchema.js";
