import { CallTrace } from "@tevm/voltaire";

type CallTraceType = CallTrace.CallTraceType;

/**
 * Flattens a call trace tree into a flat array.
 * Recursively traverses all nested calls.
 *
 * @param trace - The root call trace
 * @returns Flat array of all call traces in the tree
 * @example
 * ```typescript
 * import * as CallTrace from 'voltaire-effect/CallTrace'
 *
 * const allCalls = CallTrace.flatten(rootTrace)
 * const externalCalls = allCalls.filter(c => c.type === 'CALL')
 * ```
 * @since 0.0.1
 */
export const flatten = (trace: CallTraceType): CallTraceType[] =>
	CallTrace.flatten(trace);
