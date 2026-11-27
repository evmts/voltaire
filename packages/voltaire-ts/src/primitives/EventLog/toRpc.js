/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 * @typedef {import('./EventLogType.js').RpcLog} RpcLog
 */

/**
 * Convert Uint8Array or hex string to 0x-prefixed hex string
 * @internal
 * @param {Uint8Array | string} value
 * @returns {string}
 */
function toHexField(value) {
	if (typeof value === "string") {
		return value;
	}
	let hex = "0x";
	for (let i = 0; i < value.length; i++) {
		hex += /** @type {number} */ (value[i]).toString(16).padStart(2, "0");
	}
	return hex;
}

/**
 * Convert optional Uint8Array or hex string, preserving null and undefined
 * @internal
 * @param {Uint8Array | string | null | undefined} value
 * @returns {string | null | undefined}
 */
function toOptionalHexField(value) {
	if (value === null || value === undefined) {
		return value;
	}
	return toHexField(value);
}

/**
 * Convert a numeric quantity to a minimal 0x-prefixed hex string, or null
 * @internal
 * @param {string | bigint | number | null | undefined} value
 * @returns {string | null}
 */
function toQuantityHex(value) {
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		return value;
	}
	return `0x${value.toString(16)}`;
}

/**
 * Convert EventLog to RPC format
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {BrandedEventLog} log - EventLog branded type
 * @returns {RpcLog} RPC log object
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
	/** @type {RpcLog} */
	const rpcLog = {
		address: toHexField(log.address),
		blockHash: toOptionalHexField(log.blockHash),
		blockNumber: toQuantityHex(log.blockNumber),
		data: toHexField(log.data),
		logIndex: toQuantityHex(log.logIndex),
		topics: log.topics.map((topic) => toHexField(topic)),
		transactionHash: toOptionalHexField(log.transactionHash),
		transactionIndex: toQuantityHex(log.transactionIndex),
		removed: log.removed ?? false,
	};

	if ("blockTimestamp" in log) {
		rpcLog.blockTimestamp = toQuantityHex(
			/** @type {string | bigint | number | null | undefined} */ (
				log.blockTimestamp
			),
		);
	}

	return rpcLog;
}
