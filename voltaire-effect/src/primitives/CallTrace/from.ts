import { CallTrace } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type CallTraceType = CallTrace.CallTraceType

/**
 * Creates a CallTrace from raw trace data.
 *
 * @param data - Raw call trace data from EVM execution
 * @returns Effect yielding CallTraceType or failing with Error
 * @example
 * ```typescript
 * import * as CallTrace from 'voltaire-effect/CallTrace'
 * import { Effect } from 'effect'
 *
 * const program = CallTrace.from({
 *   type: 'CALL',
 *   from: '0x...',
 *   to: '0x...',
 *   gas: 21000n,
 *   gasUsed: 21000n,
 *   input: '0x',
 *   output: '0x'
 * })
 * const trace = Effect.runSync(program)
 * ```
 * @since 0.0.1
 */
export const from = (data: Parameters<typeof CallTrace.from>[0]): Effect.Effect<CallTraceType, Error> =>
  Effect.try({
    try: () => CallTrace.from(data),
    catch: (e) => e as Error
  })
