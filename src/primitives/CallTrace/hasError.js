/**
 * Checks if a CallTrace has an error
 *
 * @param {import('./CallTraceType.js').CallTraceType} trace - CallTrace to check
 * @returns {boolean} True if call failed
 * @example
 * ```javascript
 * import { hasError } from './hasError.js';
 * if (hasError(trace)) {
 *   console.error(`Call failed: ${trace.error}`);
 * }
 * ```
 */
export function hasError(trace) {
	return trace.error !== undefined && trace.error !== "";
}
