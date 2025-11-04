import type { BrandedEventLog } from "./BrandedEventLog.js";
import { create } from "./create.js";

/**
 * Create EventLog from parameters
 *
 * @param params - Event log parameters
 * @returns EventLog
 *
 * @example
 * ```typescript
 * const log = EventLog.from({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 * ```
 */
export function from(params: Parameters<typeof create>[0]): BrandedEventLog {
	return create(params) as BrandedEventLog;
}
