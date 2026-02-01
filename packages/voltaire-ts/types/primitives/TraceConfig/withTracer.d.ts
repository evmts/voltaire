/**
 * Creates a TraceConfig with a specific tracer
 *
 * @param {import('./TraceConfigType.js').TraceConfigType} config - Base config
 * @param {string} tracer - Tracer name ("callTracer", "prestateTracer", etc)
 * @param {Record<string, unknown>} [tracerConfig] - Tracer-specific config
 * @returns {import('./TraceConfigType.js').TraceConfigType} Updated config
 * @example
 * ```javascript
 * import { withTracer } from './withTracer.js';
 * const config = withTracer({}, "callTracer", { onlyTopCall: true });
 * ```
 */
export function withTracer(config: import("./TraceConfigType.js").TraceConfigType, tracer: string, tracerConfig?: Record<string, unknown>): import("./TraceConfigType.js").TraceConfigType;
//# sourceMappingURL=withTracer.d.ts.map