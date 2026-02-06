import type { CallTrace } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * Type representing an EVM call trace.
 * Contains information about contract calls during EVM execution.
 * @since 0.0.1
 */
type CallTraceType = CallTrace.CallTraceType;

const CallTraceTypeSchema = Schema.declare<CallTraceType>(
	(u): u is CallTraceType => {
		if (typeof u !== "object" || u === null) return false;
		return "type" in u && "from" in u && "gas" in u;
	},
	{ identifier: "CallTrace" },
);

/**
 * Effect Schema for validating EVM call traces.
 * Call traces contain detailed information about contract calls during execution.
 *
 * @example
 * ```typescript
 * import * as CallTrace from 'voltaire-effect/CallTrace'
 * import * as Schema from 'effect/Schema'
 *
 * const trace = Schema.decodeSync(CallTrace.Schema)(traceData)
 * ```
 * @since 0.0.1
 */
export const CallTraceSchema: Schema.Schema<CallTraceType, CallTraceType> =
	Schema.transformOrFail(CallTraceTypeSchema, CallTraceTypeSchema, {
		strict: true,
		decode: (t, _options, _ast) => ParseResult.succeed(t),
		encode: (t) => ParseResult.succeed(t),
	}).annotations({ identifier: "CallTraceSchema" });
