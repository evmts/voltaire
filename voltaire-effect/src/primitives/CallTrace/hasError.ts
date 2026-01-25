import { CallTrace } from '@tevm/voltaire'

type CallTraceType = CallTrace.CallTraceType

/**
 * Checks if a call trace contains an error.
 *
 * @param trace - The call trace to check
 * @returns true if the trace or any nested call has an error
 * @example
 * ```typescript
 * import * as CallTrace from 'voltaire-effect/CallTrace'
 *
 * const trace = CallTrace.from({ ... })
 * if (CallTrace.hasError(trace)) {
 *   console.log('Transaction reverted')
 * }
 * ```
 * @since 0.0.1
 */
export const hasError = (trace: CallTraceType): boolean => CallTrace.hasError(trace)
