/**
 * Gets nested calls from a CallTrace
 *
 * @param {import('./CallTraceType.js').CallTraceType} trace - CallTrace to extract calls from
 * @returns {readonly import('./CallTraceType.js').CallTraceType[]} Nested calls (empty array if none)
 * @example
 * ```javascript
 * import { getCalls } from './getCalls.js';
 * const nestedCalls = getCalls(trace);
 * console.log(`${nestedCalls.length} nested calls`);
 * ```
 */
export function getCalls(trace) {
    return trace.calls ?? [];
}
