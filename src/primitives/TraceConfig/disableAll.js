/**
 * Creates a minimal TraceConfig with all tracking disabled
 * Useful for maximum performance when only basic execution info is needed
 *
 * @param {import('./TraceConfigType.js').TraceConfigType} [config={}] - Base config
 * @returns {import('./TraceConfigType.js').TraceConfigType} Config with all tracking disabled
 * @example
 * ```javascript
 * import { disableAll } from './disableAll.js';
 * const config = disableAll();
 * ```
 */
export function disableAll(config = {}) {
	return {
		...config,
		disableStorage: true,
		disableStack: true,
		disableMemory: true,
	};
}
