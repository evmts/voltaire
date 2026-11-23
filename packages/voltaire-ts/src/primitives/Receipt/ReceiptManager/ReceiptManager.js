/**
 * @typedef {import('../../BlockHash/BlockHashType.js').BlockHashType} BlockHashType
 * @typedef {import('../../TransactionHash/TransactionHashType.js').TransactionHashType} TransactionHashType
 * @typedef {import('../../EventLog/EventLogType.js').EventLogType} EventLogType
 * @typedef {import('../ReceiptType.js').ReceiptType} ReceiptType
 * @typedef {import('./ReceiptManagerType.js').ReceiptManagerType} ReceiptManagerType
 * @typedef {import('./ReceiptManagerType.js').ReceiptLogFilter} ReceiptLogFilter
 * @typedef {import('./ReceiptManagerType.js').ReceiptLookup} ReceiptLookup
 */

import { fromBytes as hashFromBytes } from "../../Hash/fromBytes.js";
import { InvalidReceiptLengthError } from "../errors.js";

/**
 * Lowercase hex key for a byte array
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function toKey(bytes) {
	let out = "";
	for (let i = 0; i < bytes.length; i++) {
		out += /** @type {number} */ (bytes[i]).toString(16).padStart(2, "0");
	}
	return out;
}

/**
 * Key for a 32-byte hash, rejecting anything else
 *
 * @param {Uint8Array} hash
 * @param {string} field
 * @returns {string}
 * @throws {InvalidReceiptLengthError} If hash is not 32 bytes
 */
function hashKey(hash, field) {
	if (!(hash instanceof Uint8Array) || hash.length !== 32) {
		throw new InvalidReceiptLengthError(
			field,
			32,
			hash instanceof Uint8Array ? hash.length : 0,
		);
	}
	return toKey(hash);
}

/**
 * @template {Uint8Array} T
 * @param {T} bytes
 * @returns {T}
 */
function copyBytes(bytes) {
	return /** @type {T} */ (new Uint8Array(bytes));
}

/**
 * @param {EventLogType} log
 * @returns {EventLogType}
 */
function copyLog(log) {
	return {
		...log,
		address: copyBytes(log.address),
		topics: log.topics.map(copyBytes),
		data: copyBytes(log.data),
		...(log.blockHash != null && { blockHash: copyBytes(log.blockHash) }),
		...(log.transactionHash != null && {
			transactionHash: copyBytes(log.transactionHash),
		}),
	};
}

/**
 * @param {ReceiptType} receipt
 * @returns {ReceiptType}
 */
function copyReceipt(receipt) {
	return {
		...receipt,
		transactionHash: copyBytes(receipt.transactionHash),
		blockHash: copyBytes(receipt.blockHash),
		from: copyBytes(receipt.from),
		to: receipt.to === null ? null : copyBytes(receipt.to),
		contractAddress:
			receipt.contractAddress === null
				? null
				: copyBytes(receipt.contractAddress),
		logs: receipt.logs.map(copyLog),
		logsBloom: copyBytes(receipt.logsBloom),
		...(receipt.root != null && { root: copyBytes(receipt.root) }),
	};
}

/**
 * Create an in-memory receipt store for a dev node (Tevm / ZEVM).
 *
 * Receipts are indexed by block hash and by transaction hash. Logs are
 * derived from stored receipts, so `deleteReceipts` removes a block's
 * receipts, logs and tx hash index entries together (reorg-safe).
 *
 * @see https://voltaire.tevm.sh/primitives/receipt for Receipt documentation
 * @since 0.0.0
 * @returns {ReceiptManagerType} Receipt manager
 * @throws {never}
 * @example
 * ```javascript
 * import { ReceiptManager } from './primitives/Receipt/index.js';
 * const manager = ReceiptManager();
 * manager.saveReceipts(blockHash, receipts);
 * const found = manager.getReceiptByTxHash(txHash);
 * const logs = manager.getLogs({ address, topics: [topic0, null] });
 * ```
 */
export function ReceiptManager() {
	/** @type {Map<string, { blockHash: BlockHashType, receipts: readonly ReceiptType[], txKeys: readonly string[] }>} */
	const blocks = new Map();
	/**
	 * Per tx hash, every stored location in save order. The last entry is the
	 * most recently stored block holding the transaction, so a lookup reads the
	 * top and a delete only touches the deleted block's own transactions.
	 *
	 * @type {Map<string, { blockKey: string, txIndex: number }[]>}
	 */
	const txLocations = new Map();

	/**
	 * Remove a block. Cost is proportional to the block's receipts (times the
	 * number of forks sharing a transaction), not to the number of stored
	 * blocks.
	 *
	 * @param {string} blockKey
	 * @returns {boolean}
	 */
	function remove(blockKey) {
		const block = blocks.get(blockKey);
		if (!block) return false;
		blocks.delete(blockKey);
		for (const txKey of new Set(block.txKeys)) {
			const locations = txLocations.get(txKey);
			if (!locations) continue;
			const kept = locations.filter((l) => l.blockKey !== blockKey);
			if (kept.length === 0) {
				txLocations.delete(txKey);
			} else {
				txLocations.set(txKey, kept);
			}
		}
		return true;
	}

	return {
		saveReceipts(blockHash, receipts) {
			const blockKey = hashKey(blockHash, "blockHash");
			const txKeys = receipts.map((r) =>
				hashKey(r.transactionHash, "transactionHash"),
			);
			const stored = {
				blockHash: copyBytes(blockHash),
				receipts: receipts.map(copyReceipt),
				txKeys,
			};
			remove(blockKey);
			blocks.set(blockKey, stored);
			txKeys.forEach((key, index) => {
				const location = { blockKey, txIndex: index };
				const locations = txLocations.get(key);
				if (locations) {
					locations.push(location);
				} else {
					txLocations.set(key, [location]);
				}
			});
		},

		getReceipts(blockHash) {
			const block = blocks.get(hashKey(blockHash, "blockHash"));
			return block && Object.freeze(block.receipts.map(copyReceipt));
		},

		getReceiptByTxHash(txHash) {
			const locations = txLocations.get(hashKey(txHash, "transactionHash"));
			const entry = locations?.[locations.length - 1];
			if (!entry) return undefined;
			const block = blocks.get(entry.blockKey);
			const receipt = block?.receipts[entry.txIndex];
			if (!block || !receipt) return undefined;
			return {
				receipt: copyReceipt(receipt),
				blockHash: copyBytes(block.blockHash),
				txIndex: entry.txIndex,
			};
		},

		getLogs(filter = {}) {
			const blockKeys = filter.blockHashes
				? [...new Set(filter.blockHashes.map((h) => hashKey(h, "blockHash")))]
				: [...blocks.keys()];
			const addresses = compileAddresses(filter.address);
			const topics = (filter.topics ?? []).map(compileTopic);

			/** @type {EventLogType[]} */
			const out = [];
			for (const blockKey of blockKeys) {
				const block = blocks.get(blockKey);
				if (!block) continue;
				let logIndex = 0;
				block.receipts.forEach((receipt, txI) => {
					for (const log of receipt.logs) {
						const index = logIndex++;
						if (addresses && !addresses.has(toKey(log.address))) continue;
						if (!matchTopics(log.topics, topics)) continue;
						out.push(withPosition(log, block.blockHash, receipt, txI, index));
					}
				});
			}
			return out;
		},

		deleteReceipts(blockHash) {
			return remove(hashKey(blockHash, "blockHash"));
		},

		hasReceipts(blockHash) {
			return blocks.has(hashKey(blockHash, "blockHash"));
		},

		clear() {
			blocks.clear();
			txLocations.clear();
		},
	};
}

/**
 * eth_getLogs positional topic match. Every filter position requires a topic.
 *
 * @param {readonly Uint8Array[]} logTopics
 * @param {readonly (Set<string> | undefined)[]} filter
 * @returns {boolean}
 */
function matchTopics(logTopics, filter) {
	if (filter.length > logTopics.length) return false;
	for (let i = 0; i < filter.length; i++) {
		const allowed = filter[i];
		if (allowed === undefined) continue;
		const topic = logTopics[i];
		if (topic === undefined || !allowed.has(toKey(topic))) return false;
	}
	return true;
}

/**
 * Address filter as a key set; undefined matches any address
 *
 * @param {ReceiptLogFilter['address']} address
 * @returns {Set<string> | undefined}
 */
function compileAddresses(address) {
	if (address === undefined) return undefined;
	const list = /** @type {readonly Uint8Array[]} */ (
		Array.isArray(address) ? address : [address]
	);
	return list.length === 0 ? undefined : new Set(list.map(toKey));
}

/**
 * Topic position as a key set; undefined is a wildcard
 *
 * @param {Uint8Array | readonly Uint8Array[] | null | undefined} topic
 * @returns {Set<string> | undefined}
 */
function compileTopic(topic) {
	if (topic == null) return undefined;
	const list = /** @type {readonly Uint8Array[]} */ (
		Array.isArray(topic) ? topic : [topic]
	);
	return list.length === 0 ? undefined : new Set(list.map(toKey));
}

/**
 * Copy of a log with its stored block and transaction positions
 *
 * @param {EventLogType} log
 * @param {BlockHashType} blockHash
 * @param {ReceiptType} receipt
 * @param {number} txIndex
 * @param {number} logIndex
 * @returns {EventLogType}
 */
function withPosition(log, blockHash, receipt, txIndex, logIndex) {
	return {
		...copyLog(log),
		blockHash: hashFromBytes(blockHash),
		blockNumber: receipt.blockNumber ?? log.blockNumber,
		transactionHash: hashFromBytes(receipt.transactionHash),
		transactionIndex: txIndex,
		logIndex,
		removed: log.removed ?? false,
	};
}
