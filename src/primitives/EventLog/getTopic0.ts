import type { Hash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";

/**
 * Get topic0 (event signature) from log
 *
 * @param log Event log
 * @returns Topic0 hash or undefined if no topics
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const topic0_1 = EventLog.getTopic0(log);
 * const topic0_2 = log.getTopic0();
 * ```
 */
export function getTopic0<T extends BrandedEventLog>(log: T): Hash | undefined {
	return log.topics[0];
}
