/**
 * Flattens a call tree into a linear list of all calls
 * Useful for analyzing all calls in execution order
 *
 * @param {import('./CallTraceType.js').CallTraceType} trace - Root call trace
 * @returns {import('./CallTraceType.js').CallTraceType[]} Flat array of all calls (including root)
 * @example
 * ```javascript
 * import { flatten } from './flatten.js';
 * const allCalls = flatten(rootTrace);
 * const failedCalls = allCalls.filter(call => call.error);
 * ```
 */
export function flatten(trace) {
    const result = [trace];
    if (trace.calls) {
        for (const call of trace.calls) {
            result.push(...flatten(call));
        }
    }
    return result;
}
