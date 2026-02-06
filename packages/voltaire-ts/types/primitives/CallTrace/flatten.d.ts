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
export function flatten(trace: import("./CallTraceType.js").CallTraceType): import("./CallTraceType.js").CallTraceType[];
//# sourceMappingURL=flatten.d.ts.map