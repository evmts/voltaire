/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import * as OxLog from "ox/Log";

/**
 * Convert EventLog to RPC format
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {BrandedEventLog} log - EventLog branded type
 * @returns {import('ox/Log').Rpc} RPC log object
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * const log = EventLog.create({
 *   address: Address.from("0x..."),
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([1, 2, 3]),
 *   blockNumber: 1n,
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   logIndex: 0,
 *   removed: false
 * });
 * const rpcLog = EventLog.toRpc(log);
 * ```
 */
export function toRpc(log) {
	// Remove brand tag before passing to ox
	const { __tag, ...logWithoutTag } = log;
	return OxLog.toRpc(/** @type {any} */ (logWithoutTag));
}
