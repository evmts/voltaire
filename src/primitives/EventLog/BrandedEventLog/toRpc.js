/**
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

import * as OxLog from "ox/Log";

/**
 * Convert EventLog to RPC format
 *
 * @param {BrandedEventLog} log - EventLog branded type
 * @returns {import('ox/Log').Rpc} RPC log object
 *
 * @example
 * ```typescript
 * const log = EventLog.create({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
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
