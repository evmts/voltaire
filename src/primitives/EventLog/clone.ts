import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Clone event log with deep copy of topics and data
 *
 * @param log Event log
 * @returns Cloned log
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const cloned1 = EventLog.clone(log);
 * const cloned2 = log.clone();
 * ```
 */
export function clone<T extends BrandedEventLog>(log: T): T {
	return {
		...log,
		topics: [...log.topics],
		data: new Uint8Array(log.data),
	} as T;
}
