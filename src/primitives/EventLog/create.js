/**
 * @typedef {import('../Address/index.js').BrandedAddress} BrandedAddress
 * @typedef {import('../Hash/index.js').Hash} Hash
 * @typedef {import('../Hash/index.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Create event log
 *
 * @param {Object} params - Event log parameters
 * @param {BrandedAddress} params.address - Contract address
 * @param {readonly Hash[]} params.topics - Event topics
 * @param {Uint8Array} params.data - Event data
 * @param {bigint} [params.blockNumber] - Block number
 * @param {BrandedHash} [params.transactionHash] - Transaction hash
 * @param {number} [params.transactionIndex] - Transaction index
 * @param {BrandedHash} [params.blockHash] - Block hash
 * @param {number} [params.logIndex] - Log index
 * @param {boolean} [params.removed] - Whether log was removed
 * @returns {BrandedEventLog} EventLog object
 *
 * @example
 * ```typescript
 * // Static call
 * const log = EventLog.create({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 *
 * // Factory call
 * const log2 = EventLog({
 *   address: "0x..." as Address,
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([...]),
 * });
 * ```
 */
export function create(params) {
	const result = {
		__tag: "EventLog",
		address: params.address,
		topics: params.topics,
		data: params.data,
		removed: params.removed ?? false,
	};
	if (params.blockNumber !== undefined) {
		result.blockNumber = params.blockNumber;
	}
	if (params.transactionHash !== undefined) {
		result.transactionHash = params.transactionHash;
	}
	if (params.transactionIndex !== undefined) {
		result.transactionIndex = params.transactionIndex;
	}
	if (params.blockHash !== undefined) {
		result.blockHash = params.blockHash;
	}
	if (params.logIndex !== undefined) {
		result.logIndex = params.logIndex;
	}
	return result;
}
