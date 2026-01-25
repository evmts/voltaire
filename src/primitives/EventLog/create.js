/**
 * @typedef {import('../Address/AddressType.js').AddressType} BrandedAddress
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */

import { InvalidLengthError } from "../errors/index.js";
import { isHash } from "../Hash/isHash.js";

/**
 * Create event log
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {Object} params - Event log parameters
 * @param {BrandedAddress} params.address - Contract address
 * @param {readonly HashType[]} params.topics - Event topics
 * @param {Uint8Array} params.data - Event data
 * @param {bigint} [params.blockNumber] - Block number
 * @param {HashType} [params.transactionHash] - Transaction hash
 * @param {number} [params.transactionIndex] - Transaction index
 * @param {HashType} [params.blockHash] - Block hash
 * @param {number} [params.logIndex] - Log index
 * @param {boolean} [params.removed] - Whether log was removed
 * @returns {BrandedEventLog} EventLog object
 * @throws {InvalidLengthError} If any topic is not exactly 32 bytes
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
	// Validate topics are 32-byte hashes
	for (let i = 0; i < params.topics.length; i++) {
		const topic = params.topics[i];
		if (!isHash(topic)) {
			/** @type {unknown} */
			const t = topic;
			const length = t instanceof Uint8Array ? t.length : "unknown";
			throw new InvalidLengthError(
				`Topic at index ${i} is not a valid 32-byte hash`,
				{
					code: -32602,
					value: topic,
					expected: "32-byte Uint8Array (Hash)",
					context: { index: i, actualLength: length },
					docsPath: "/primitives/eventlog",
				},
			);
		}
	}

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
	return /** @type {import('./EventLogType.js').BrandedEventLog} */ (result);
}
