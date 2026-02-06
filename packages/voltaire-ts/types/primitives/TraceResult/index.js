export { from as _from } from "./from.js";
export { getCallTrace as _getCallTrace } from "./getCallTrace.js";
export { getStructLogs as _getStructLogs } from "./getStructLogs.js";
import { from as _from } from "./from.js";
import { getCallTrace as _getCallTrace } from "./getCallTrace.js";
import { getStructLogs as _getStructLogs } from "./getStructLogs.js";
/**
 * Creates a TraceResult from raw data
 *
 * @see https://voltaire.tevm.sh/primitives/trace-result for TraceResult documentation
 * @since 0.0.0
 * @param data - TraceResult data
 * @returns TraceResult instance
 * @example
 * ```typescript
 * import { TraceResult } from './primitives/TraceResult/index.js';
 * const result = TraceResult.from({ gas: 50000n, failed: false, returnValue: new Uint8Array() });
 * ```
 */
export function from(data) {
    return _from(data);
}
/**
 * Gets structured logs from a TraceResult
 *
 * @param result - TraceResult to extract logs from
 * @returns Structured logs
 * @example
 * ```typescript
 * import { TraceResult } from './primitives/TraceResult/index.js';
 * const logs = TraceResult.getStructLogs(result);
 * ```
 */
export function getStructLogs(result) {
    return _getStructLogs(result);
}
/**
 * Gets call trace from a TraceResult
 *
 * @param result - TraceResult to extract call trace from
 * @returns Call trace
 * @example
 * ```typescript
 * import { TraceResult } from './primitives/TraceResult/index.js';
 * const trace = TraceResult.getCallTrace(result);
 * ```
 */
export function getCallTrace(result) {
    return _getCallTrace(result);
}
