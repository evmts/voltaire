export type { CallTraceType } from "./CallTraceType.js";
export { flatten as _flatten } from "./flatten.js";
export { from as _from } from "./from.js";
export { getCalls as _getCalls } from "./getCalls.js";
export { hasError as _hasError } from "./hasError.js";

import type { CallTraceType } from "./CallTraceType.js";
import { flatten as _flatten } from "./flatten.js";
import { from as _from } from "./from.js";
import { getCalls as _getCalls } from "./getCalls.js";
import { hasError as _hasError } from "./hasError.js";

/**
 * Creates a CallTrace from raw data
 *
 * @see https://voltaire.tevm.sh/primitives/call-trace for CallTrace documentation
 * @since 0.0.0
 * @param data - CallTrace data
 * @returns CallTrace instance
 * @example
 * ```typescript
 * import { CallTrace } from './primitives/CallTrace/index.js';
 * const trace = CallTrace.from({ type: "CALL", from, to, gas: 100000n, gasUsed: 50000n, input, output });
 * ```
 */
export function from(
	data: Omit<CallTraceType, typeof import("../../brand.js").brand>,
): CallTraceType {
	return _from(data);
}

/**
 * Gets nested calls from a CallTrace
 *
 * @param trace - CallTrace to extract calls from
 * @returns Nested calls
 * @example
 * ```typescript
 * import { CallTrace } from './primitives/CallTrace/index.js';
 * const calls = CallTrace.getCalls(trace);
 * ```
 */
export function getCalls(trace: CallTraceType): readonly CallTraceType[] {
	return _getCalls(trace);
}

/**
 * Checks if a CallTrace has an error
 *
 * @param trace - CallTrace to check
 * @returns True if call failed
 * @example
 * ```typescript
 * import { CallTrace } from './primitives/CallTrace/index.js';
 * if (CallTrace.hasError(trace)) console.error(trace.error);
 * ```
 */
export function hasError(trace: CallTraceType): boolean {
	return _hasError(trace);
}

/**
 * Flattens a call tree into a linear list
 *
 * @param trace - Root call trace
 * @returns Flat array of all calls
 * @example
 * ```typescript
 * import { CallTrace } from './primitives/CallTrace/index.js';
 * const allCalls = CallTrace.flatten(trace);
 * ```
 */
export function flatten(trace: CallTraceType): CallTraceType[] {
	return _flatten(trace);
}
