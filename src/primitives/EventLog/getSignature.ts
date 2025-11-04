import type { Hash } from "../Hash/index.js";
import type { BrandedEventLog } from "./BrandedEventLog.js";
import { getTopic0 } from "./getTopic0.js";

/**
 * Get event signature (alias for getTopic0)
 *
 * @param log Event log
 * @returns Event signature hash or undefined if no topics
 *
 * @example
 * ```typescript
 * const log = EventLog.create({ ... });
 * const sig1 = EventLog.getSignature(log);
 * const sig2 = log.getSignature();
 * ```
 */
export function getSignature<T extends BrandedEventLog>(log: T): Hash | undefined {
	return getTopic0(log);
}
