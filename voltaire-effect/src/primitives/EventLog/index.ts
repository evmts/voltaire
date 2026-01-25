/**
 * @module EventLog
 * @description Event logs emitted by smart contracts.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as EventLog from 'voltaire-effect/primitives/EventLog'
 *
 * function parseLog(log: EventLog.EventLogType) {
 *   // ...
 * }
 * ```
 *
 * @since 0.0.1
 */
export {
	EventLogSchema,
	type EventLogType,
	EventLogTypeSchema,
	Schema,
	Rpc,
} from "./Rpc.js";
