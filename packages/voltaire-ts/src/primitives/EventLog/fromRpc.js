/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 * @typedef {import('./EventLogType.js').RpcLog} RpcLog
 */

/**
 * Convert RPC log format to EventLog
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {RpcLog} rpcLog - RPC log object
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
	/** @type {Record<string, unknown>} */
	const result = {
		...rpcLog,
		blockNumber:
			rpcLog.blockNumber === null || rpcLog.blockNumber === undefined
				? null
				: BigInt(rpcLog.blockNumber),
		logIndex:
			rpcLog.logIndex === null || rpcLog.logIndex === undefined
				? null
				: Number(rpcLog.logIndex),
		transactionIndex:
			rpcLog.transactionIndex === null || rpcLog.transactionIndex === undefined
				? null
				: Number(rpcLog.transactionIndex),
		removed: rpcLog.removed ?? false,
	};

	if ("blockTimestamp" in rpcLog) {
		result.blockTimestamp =
			rpcLog.blockTimestamp === null || rpcLog.blockTimestamp === undefined
				? null
				: BigInt(rpcLog.blockTimestamp);
	}

	return /** @type {BrandedEventLog} */ (/** @type {unknown} */ (result));
}
