/**
 * @module clone
 * @description Pure EventLog clone/copy functions
 * @since 0.1.0
 */
import * as EventLog from "@tevm/voltaire/EventLog";
import type { EventLogType } from "@tevm/voltaire/EventLog";

/**
 * Create deep clone of EventLog
 */
export const clone = (log: EventLogType): EventLogType => EventLog.clone(log);

/**
 * Copy EventLog (alias for clone)
 */
export const copy = (log: EventLogType): EventLogType => EventLog.copy(log);
