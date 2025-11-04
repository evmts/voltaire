import type { BrandedEventLog } from "./BrandedEventLog.js";
import { clone } from "./clone.js";

/**
 * Copy event log (alias for clone)
 *
 * @param log Event log
 * @returns Copied log
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const copied1 = EventLog.copy(log);
 * const copied2 = log.copy();
 * ```
 */
export function copy<T extends BrandedEventLog>(log: T): T {
	return clone(log);
}
