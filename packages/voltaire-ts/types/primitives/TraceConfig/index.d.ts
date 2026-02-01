export { disableAll as _disableAll } from "./disableAll.js";
export { from as _from } from "./from.js";
export type { TraceConfigType } from "./TraceConfigType.js";
export { withTracer as _withTracer } from "./withTracer.js";
import type { TraceConfigType } from "./TraceConfigType.js";
/**
 * Creates a TraceConfig from configuration options
 *
 * @see https://voltaire.tevm.sh/primitives/trace-config for TraceConfig documentation
 * @since 0.0.0
 * @param config - Trace configuration options
 * @returns TraceConfig instance
 * @example
 * ```typescript
 * import { TraceConfig } from './primitives/TraceConfig/index.js';
 * const config = TraceConfig.from({ disableStorage: true });
 * ```
 */
export declare function from(config?: Partial<TraceConfigType>): TraceConfigType;
/**
 * Creates a TraceConfig with a specific tracer
 *
 * @param config - Base config
 * @param tracer - Tracer name ("callTracer", "prestateTracer", etc)
 * @param tracerConfig - Tracer-specific config
 * @returns Updated config
 * @example
 * ```typescript
 * import { TraceConfig } from './primitives/TraceConfig/index.js';
 * const config = TraceConfig.withTracer({}, "callTracer");
 * ```
 */
export declare function withTracer(config: TraceConfigType, tracer: string, tracerConfig?: Record<string, unknown>): TraceConfigType;
/**
 * Creates a minimal TraceConfig with all tracking disabled
 *
 * @param config - Base config
 * @returns Config with all tracking disabled
 * @example
 * ```typescript
 * import { TraceConfig } from './primitives/TraceConfig/index.js';
 * const config = TraceConfig.disableAll();
 * ```
 */
export declare function disableAll(config?: TraceConfigType): TraceConfigType;
//# sourceMappingURL=index.d.ts.map