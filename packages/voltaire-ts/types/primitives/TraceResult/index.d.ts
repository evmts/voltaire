export { from as _from } from "./from.js";
export { getCallTrace as _getCallTrace } from "./getCallTrace.js";
export { getStructLogs as _getStructLogs } from "./getStructLogs.js";
export type { TraceResultType } from "./TraceResultType.js";
import type { CallTraceType } from "../CallTrace/CallTraceType.js";
import type { StructLogType } from "../StructLog/StructLogType.js";
import type { TraceResultType } from "./TraceResultType.js";
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
export declare function from(data: Omit<TraceResultType, typeof import("../../brand.js").brand>): TraceResultType;
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
export declare function getStructLogs(result: TraceResultType): readonly StructLogType[];
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
export declare function getCallTrace(result: TraceResultType): CallTraceType | undefined;
//# sourceMappingURL=index.d.ts.map