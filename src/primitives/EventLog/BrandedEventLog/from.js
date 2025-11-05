/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { create } from "./create.js";

/**
 * Create EventLog from parameters
 *
 * @param {Parameters<typeof create>[0]} params - Event log parameters
 * @returns {BrandedEventLog}
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
export function from(params) {
	return create(params);
}
