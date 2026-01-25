import { CallTrace } from "@tevm/voltaire";

type CallTraceType = CallTrace.CallTraceType;

/**
 * Gets the immediate child calls from a call trace.
 *
 * @param trace - The parent call trace
 * @returns Array of child call traces (non-recursive)
 * @example
 * ```typescript
 * import * as CallTrace from 'voltaire-effect/CallTrace'
 *
 * const childCalls = CallTrace.getCalls(parentTrace)
 * console.log(`Found ${childCalls.length} direct subcalls`)
 * ```
 * @since 0.0.1
 */
export const getCalls = (trace: CallTraceType): readonly CallTraceType[] =>
	CallTrace.getCalls(trace);
