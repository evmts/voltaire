/**
 * @module filtering
 * @description Pure EventLog filtering functions
 * @since 0.1.0
 */
import * as EventLog from "@tevm/voltaire/EventLog";
import type { EventLogType } from "@tevm/voltaire/EventLog";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";

interface LogFilter {
  address?: AddressType | AddressType[];
  topics?: (HashType | HashType[] | null)[];
}

/**
 * Check if log matches given address
 */
export const matchesAddress = (
  log: EventLogType,
  address: AddressType | AddressType[],
): boolean => EventLog.matchesAddress(log, address);

/**
 * Check if log matches topic filter
 */
export const matchesTopics = (
  log: EventLogType,
  topics: (HashType | HashType[] | null)[],
): boolean => EventLog.matchesTopics(log, topics);

/**
 * Check if log matches full filter (address + topics)
 */
export const matchesFilter = (log: EventLogType, filter: LogFilter): boolean =>
  EventLog.matchesFilter(log, filter);

/**
 * Filter array of logs by filter criteria
 */
export const filterLogs = (logs: EventLogType[], filter: LogFilter): EventLogType[] =>
  EventLog.filterLogs(logs, filter);

/**
 * Sort logs by block number, transaction index, and log index
 */
export const sortLogs = (logs: EventLogType[]): EventLogType[] =>
  EventLog.sortLogs(logs);
