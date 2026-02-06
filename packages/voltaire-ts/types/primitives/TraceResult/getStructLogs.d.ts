/**
 * Gets structured logs from a TraceResult
 *
 * @param {import('./TraceResultType.js').TraceResultType} result - TraceResult to extract logs from
 * @returns {readonly import('../StructLog/StructLogType.js').StructLogType[]} Structured logs (empty array if none)
 * @example
 * ```javascript
 * import { getStructLogs } from './getStructLogs.js';
 * const logs = getStructLogs(result);
 * console.log(`${logs.length} opcodes executed`);
 * ```
 */
export function getStructLogs(result: import("./TraceResultType.js").TraceResultType): readonly import("../StructLog/StructLogType.js").StructLogType[];
//# sourceMappingURL=getStructLogs.d.ts.map