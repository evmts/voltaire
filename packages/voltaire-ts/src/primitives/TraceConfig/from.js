/**
 * Creates a TraceConfig from configuration options
 *
 * @param {object} [config={}] - Trace configuration options
 * @param {boolean} [config.disableStorage] - Don't track storage changes
 * @param {boolean} [config.disableStack] - Don't track stack
 * @param {boolean} [config.disableMemory] - Don't track memory
 * @param {boolean} [config.enableMemory] - Track memory
 * @param {boolean} [config.enableReturnData] - Track return data
 * @param {string} [config.tracer] - Tracer name
 * @param {string} [config.timeout] - Timeout (e.g., "5s")
 * @param {Record<string, unknown>} [config.tracerConfig] - Tracer-specific config
 * @returns {import('./TraceConfigType.js').TraceConfigType} TraceConfig instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const config = from({ disableStorage: true, disableMemory: true });
 * ```
 */
export function from(config = {}) {
	return /** @type {import('./TraceConfigType.js').TraceConfigType} */ ({
		...config,
	});
}
