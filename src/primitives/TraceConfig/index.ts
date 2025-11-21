export type { TraceConfigType } from "./TraceConfigType.js";
export { from as _from } from "./from.js";
export { withTracer as _withTracer } from "./withTracer.js";
export { disableAll as _disableAll } from "./disableAll.js";

import type { TraceConfigType } from "./TraceConfigType.js";
import { disableAll as _disableAll } from "./disableAll.js";
import { from as _from } from "./from.js";
import { withTracer as _withTracer } from "./withTracer.js";

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
export function from(config?: Partial<TraceConfigType>): TraceConfigType {
	return _from(config);
}

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
export function withTracer(
	config: TraceConfigType,
	tracer: string,
	tracerConfig?: Record<string, unknown>,
): TraceConfigType {
	return _withTracer(config, tracer, tracerConfig);
}

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
export function disableAll(config?: TraceConfigType): TraceConfigType {
	return _disableAll(config);
}
