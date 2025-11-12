/**
 * @typedef {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} BrandedAddress
 * @typedef {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} BrandedHash
 * @typedef {import('./BrandedEventLog.js').BrandedEventLog} BrandedEventLog
 */

/**
 * Create event log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {Object} params - Event log parameters
 * @param {BrandedAddress} params.address - Contract address
 * @param {readonly BrandedHash[]} params.topics - Event topics
 * @param {Uint8Array} params.data - Event data
 * @param {bigint} [params.blockNumber] - Block number
 * @param {BrandedHash} [params.transactionHash] - Transaction hash
 * @param {number} [params.transactionIndex] - Transaction index
 * @param {BrandedHash} [params.blockHash] - Block hash
 * @param {number} [params.logIndex] - Log index
 * @param {boolean} [params.removed] - Whether log was removed
 * @returns {BrandedEventLog} EventLog object
 * @throws {never}
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const log = EventLog.create({
 *   address: Address.from("0x..."),
 *   topics: [Hash.from("0x...")],
 *   data: new Uint8Array([1, 2, 3]),
 * });
 * ```
 */
export function create(params) {
	/** @type {any} */
	const result = {
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
	return /** @type {import('./BrandedEventLog.js').BrandedEventLog} */ (result);
}
