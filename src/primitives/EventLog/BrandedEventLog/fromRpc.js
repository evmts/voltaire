/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import * as OxLog from "ox/Log";

/**
 * Convert RPC log format to EventLog
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {import('ox/Log').Rpc} rpcLog - RPC log object
 * @returns {BrandedEventLog} EventLog branded type
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const rpcLog = {
 *   address: "0x...",
 *   topics: ["0x...", "0x..."],
 *   data: "0x...",
 *   blockNumber: "0x1",
 *   transactionHash: "0x...",
 *   transactionIndex: "0x0",
 *   blockHash: "0x...",
 *   logIndex: "0x0",
 *   removed: false
 * };
 * const log = EventLog.fromRpc(rpcLog);
 * ```
 */
export function fromRpc(rpcLog) {
	const oxLog = OxLog.fromRpc(rpcLog);
	// Add brand tag to ox result
	/** @type {any} */
	const result = { ...oxLog, __tag: "EventLog" };
	return /** @type {BrandedEventLog} */ (result);
}
