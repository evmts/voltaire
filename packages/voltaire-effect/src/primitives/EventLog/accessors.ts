/**
 * @module accessors
 * @description Pure EventLog accessor functions
 * @since 0.1.0
 */
import * as EventLog from "@tevm/voltaire/EventLog";
import type { EventLogType } from "@tevm/voltaire/EventLog";
import type { HashType } from "@tevm/voltaire/Hash";

/**
 * Get topic at index 0 (event signature)
 */
export const getTopic0 = (log: EventLogType): HashType | undefined =>
  EventLog.getTopic0(log);

/**
 * Get event signature hash
 */
export const getSignature = (log: EventLogType): HashType | undefined =>
  EventLog.getSignature(log);

/**
 * Get all indexed topics (topics 1-3)
 */
export const getIndexedTopics = (log: EventLogType): readonly HashType[] =>
  EventLog.getIndexedTopics(log);

/**
 * Get indexed parameters (alias for getIndexedTopics)
 */
export const getIndexed = (log: EventLogType): readonly HashType[] =>
  EventLog.getIndexed(log);
