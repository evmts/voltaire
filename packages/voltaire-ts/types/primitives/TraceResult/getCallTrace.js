/**
 * Gets call trace from a TraceResult
 *
 * @param {import('./TraceResultType.js').TraceResultType} result - TraceResult to extract call trace from
 * @returns {import('../CallTrace/CallTraceType.js').CallTraceType | undefined} Call trace (undefined if not using callTracer)
 * @example
 * ```javascript
 * import { getCallTrace } from './getCallTrace.js';
 * const callTrace = getCallTrace(result);
 * if (callTrace) {
 *   console.log(`Root call: ${callTrace.type}`);
 * }
 * ```
 */
export function getCallTrace(result) {
    return result.callTrace;
}
