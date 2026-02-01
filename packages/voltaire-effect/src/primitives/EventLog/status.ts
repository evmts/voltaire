/**
 * @module status
 * @description Pure EventLog status functions
 * @since 0.1.0
 */
import * as EventLog from "@tevm/voltaire/EventLog";
import type { EventLogType } from "@tevm/voltaire/EventLog";

/**
 * Check if log was removed due to reorg
 */
export const isRemoved = (log: EventLogType): boolean => EventLog.isRemoved(log);

/**
 * Check if log was removed (alias)
 */
export const wasRemoved = (log: EventLogType): boolean => EventLog.wasRemoved(log);
