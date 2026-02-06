/**
 * @module EventLog
 * @description Effect-based operations for EVM event logs.
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
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `EventLog.Rpc` | RPC log object | EventLogType |
 * | `EventLog.Schema` | RPC log object | EventLogType |
 *
 * ## Constructors (Effect-wrapped)
 *
 * ```typescript
 * EventLog.create(input)  // Effect<EventLogType, Error>
 * EventLog.from(input)    // Effect<EventLogType, Error>
 * ```
 *
 * ## Accessors (Pure)
 *
 * ```typescript
 * EventLog.getTopic0(log)        // HashType | undefined
 * EventLog.getSignature(log)     // HashType | undefined
 * EventLog.getIndexed(log)       // readonly HashType[]
 * EventLog.getIndexedTopics(log) // readonly HashType[]
 * ```
 *
 * ## Filtering (Pure)
 *
 * ```typescript
 * EventLog.matchesAddress(log, address) // boolean
 * EventLog.matchesTopics(log, topics)   // boolean
 * EventLog.matchesFilter(log, filter)   // boolean
 * EventLog.filterLogs(logs, filter)     // EventLogType[]
 * EventLog.sortLogs(logs)               // EventLogType[]
 * ```
 *
 * ## Status (Pure)
 *
 * ```typescript
 * EventLog.isRemoved(log)  // boolean
 * EventLog.wasRemoved(log) // boolean
 * ```
 *
 * ## Clone/Copy (Pure)
 *
 * ```typescript
 * EventLog.clone(log) // EventLogType
 * EventLog.copy(log)  // EventLogType
 * ```
 *
 * ## Conversion (Pure)
 *
 * ```typescript
 * EventLog.toRpc(log) // RpcLog
 * ```
 *
 * @example
 * ```typescript
 * import * as EventLog from 'voltaire-effect/primitives/EventLog'
 * import * as Schema from 'effect/Schema'
 *
 * const log = Schema.decodeSync(EventLog.Rpc)({
 *   address: '0x...',
 *   topics: ['0x...'],
 *   data: new Uint8Array(32),
 * })
 *
 * const signature = EventLog.getSignature(log)
 * const transfers = EventLog.filterLogs(logs, { topics: [transferTopic] })
 * ```
 *
 * @since 0.0.1
 */

// Types
export type { EventLogType } from "@tevm/voltaire/EventLog";

// Schemas
export {
  EventLogSchema,
  EventLogTypeSchema,
  Rpc,
  Schema,
} from "./Rpc.js";

// Constructors (Effect-wrapped)
export { create, from } from "./create.js";

// Accessors (Pure)
export { getTopic0, getSignature, getIndexed, getIndexedTopics } from "./accessors.js";

// Filtering (Pure)
export { matchesAddress, matchesTopics, matchesFilter, filterLogs, sortLogs } from "./filtering.js";

// Status (Pure)
export { isRemoved, wasRemoved } from "./status.js";

// Clone/Copy (Pure)
export { clone, copy } from "./clone.js";

// Conversion (Pure)
export { toRpc } from "./toRpc.js";
