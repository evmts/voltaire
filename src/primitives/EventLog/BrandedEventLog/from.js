/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import { create } from "./create.js";

/**
 * Create EventLog from parameters
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {Parameters<typeof create>[0]} params - Event log parameters
 * @returns {BrandedEventLog}
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const log = EventLog.from({
 *   address: Address.from("0x..."),
 *   topics: [Hash.from("0x...")],
 *   data: new Uint8Array([1, 2, 3]),
 * });
 * ```
 */
export function from(params) {
	return create(params);
}
