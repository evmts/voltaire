/**
 * watchContractEvent - Viem-compatible Event Watching Action
 *
 * Watches and returns emitted contract event logs via polling or WebSocket.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-contract/watchContractEvent
 */

import * as Abi from "../../src/primitives/Abi/index.js";
import * as Event from "../../src/primitives/Abi/event/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";
import { ContractEventWatchError } from "./errors.js";

/**
 * @typedef {import('./ViemContractTypes.js').WatchContractEventParameters} WatchContractEventParameters
 * @typedef {import('./ViemContractTypes.js').WatchContractEventReturnType} WatchContractEventReturnType
 */

/**
 * Default polling interval in milliseconds
 */
const DEFAULT_POLLING_INTERVAL = 1000;

/**
 * Watches and returns emitted contract event logs.
 *
 * This Action will batch up all the event logs found within the polling interval,
 * and invoke them via `onLogs`.
 *
 * Uses polling with `eth_getLogs` to watch for events.
 *
 * @template {readonly import('../../src/primitives/Abi/AbiType.js').Item[]} TAbi
 * @template {string | undefined} TEventName
 * @param {import('./ViemContractTypes.js').Client} client - Client to use
 * @param {import('./ViemContractTypes.js').WatchContractEventParameters<TAbi, TEventName>} parameters
 * @returns {import('./ViemContractTypes.js').WatchContractEventReturnType} Unsubscribe function
 *
 * @example
 * ```typescript
 * import { watchContractEvent } from './watchContractEvent.js';
 *
 * const unwatch = watchContractEvent(client, {
 *   address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
 *   abi: erc20Abi,
 *   eventName: 'Transfer',
 *   args: { from: '0x...' },
 *   onLogs: (logs) => console.log(logs),
 * });
 *
 * // Later, to stop watching:
 * unwatch();
 * ```
 */
export function watchContractEvent(client, parameters) {
	const {
		abi: abiItems,
		address,
		args,
		eventName,
		batch = true,
		fromBlock,
		onError,
		onLogs,
		pollingInterval = client.pollingInterval ?? DEFAULT_POLLING_INTERVAL,
		strict = false,
	} = parameters;

	// Normalize address to hex string
	const addressHex =
		typeof address === "string" ? address : Hex.fromBytes(address);

	// Find the event in ABI if eventName provided
	const abiEvent = eventName
		? abiItems.find(
				(item) => item.type === "event" && item.name === eventName,
			)
		: undefined;

	// Encode topics for filtering
	/** @type {(string | null)[]} */
	let topicsHex = [];
	if (abiEvent && abiEvent.type === "event") {
		const topics = Event.encodeTopics(
			/** @type {import('../../src/primitives/Abi/event/EventType.js').EventType} */ (
				abiEvent
			),
			args || {},
		);
		topicsHex = topics.map((t) => (t === null ? null : Hex.fromBytes(t)));
	}

	// Tracking state
	let isRunning = true;
	let lastBlock = fromBlock;
	/** @type {Set<string>} */
	const seen = new Set();
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timeoutId;

	/**
	 * Create unique key for log deduplication
	 * @param {*} log
	 * @returns {string}
	 */
	function getLogKey(log) {
		return `${log.blockNumber}:${log.logIndex}`;
	}

	/**
	 * Decode raw log into structured event
	 * @param {*} log
	 * @returns {*}
	 */
	function decodeLog(log) {
		// Find matching event in ABI
		const matchingEvent = abiItems.find((item) => {
			if (item.type !== "event") return false;
			// Match by topic0 (event signature)
			const eventTopics = Event.encodeTopics(
				/** @type {import('../../src/primitives/Abi/event/EventType.js').EventType} */ (
					item
				),
				{},
			);
			const topic0Hex = eventTopics[0]
				? Hex.fromBytes(eventTopics[0])
				: null;
			return topic0Hex === log.topics[0];
		});

		if (!matchingEvent || matchingEvent.type !== "event") {
			// Return raw log if we can't decode
			return {
				address: log.address,
				blockHash: log.blockHash,
				blockNumber: BigInt(log.blockNumber),
				data: log.data,
				logIndex: Number.parseInt(log.logIndex, 16),
				topics: log.topics,
				transactionHash: log.transactionHash,
				transactionIndex: Number.parseInt(log.transactionIndex, 16),
			};
		}

		try {
			const dataBytes = Hex.toBytes(log.data);
			const topicBytes = log.topics.map((/** @type {string} */ t) =>
				Hex.toBytes(t),
			);
			const decodedArgs = Event.decodeLog(
				/** @type {import('../../src/primitives/Abi/event/EventType.js').EventType} */ (
					matchingEvent
				),
				dataBytes,
				/** @type {*} */ (topicBytes),
			);

			return {
				eventName: matchingEvent.name,
				args: decodedArgs,
				address: log.address,
				blockHash: log.blockHash,
				blockNumber: BigInt(log.blockNumber),
				data: log.data,
				logIndex: Number.parseInt(log.logIndex, 16),
				topics: log.topics,
				transactionHash: log.transactionHash,
				transactionIndex: Number.parseInt(log.transactionIndex, 16),
			};
		} catch (err) {
			if (strict) {
				throw err;
			}
			// Return log with empty args on decode error in non-strict mode
			return {
				eventName: matchingEvent.name,
				args: {},
				address: log.address,
				blockHash: log.blockHash,
				blockNumber: BigInt(log.blockNumber),
				data: log.data,
				logIndex: Number.parseInt(log.logIndex, 16),
				topics: log.topics,
				transactionHash: log.transactionHash,
				transactionIndex: Number.parseInt(log.transactionIndex, 16),
			};
		}
	}

	/**
	 * Poll for new events
	 */
	async function poll() {
		if (!isRunning) return;

		try {
			// Get current block number
			const currentBlockHex = await client.request({
				method: "eth_blockNumber",
				params: [],
			});
			const currentBlock = BigInt(currentBlockHex);

			// Initialize lastBlock if not set
			if (lastBlock === undefined) {
				lastBlock = currentBlock;
				scheduleNextPoll();
				return;
			}

			// Only fetch if new blocks
			if (currentBlock > lastBlock) {
				const fromBlockHex = `0x${(lastBlock + 1n).toString(16)}`;
				const toBlockHex = `0x${currentBlock.toString(16)}`;

				// Build filter params
				/** @type {*} */
				const filterParams = {
					address: addressHex,
					fromBlock: fromBlockHex,
					toBlock: toBlockHex,
				};

				if (topicsHex.length > 0) {
					filterParams.topics = topicsHex;
				}

				// Fetch logs
				const logs = await client.request({
					method: "eth_getLogs",
					params: [filterParams],
				});

				// Process logs with deduplication
				/** @type {any[]} */
				const newLogs = [];
				for (const log of logs) {
					const key = getLogKey(log);
					if (seen.has(key)) continue;
					seen.add(key);

					try {
						const decoded = decodeLog(log);
						newLogs.push(decoded);
					} catch (err) {
						if (strict) {
							onError?.(err);
							continue;
						}
					}
				}

				// Emit logs
				if (newLogs.length > 0) {
					if (batch) {
						onLogs(newLogs);
					} else {
						for (const log of newLogs) {
							onLogs([log]);
						}
					}
				}

				lastBlock = currentBlock;
			}
		} catch (err) {
			onError?.(err);
		}

		scheduleNextPoll();
	}

	/**
	 * Schedule the next poll
	 */
	function scheduleNextPoll() {
		if (!isRunning) return;
		timeoutId = setTimeout(poll, pollingInterval);
	}

	// Start polling
	poll();

	// Return unsubscribe function
	return () => {
		isRunning = false;
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	};
}
