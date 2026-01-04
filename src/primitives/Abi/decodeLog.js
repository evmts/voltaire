import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Event from "./event/index.js";

/**
 * Count indexed parameters in an event
 * @param {import('./event/index.js').Event} event
 * @returns {number}
 */
function countIndexedParams(event) {
	return event.inputs.filter(
		(/** @type {{ indexed?: boolean }} */ p) => p.indexed,
	).length;
}

/**
 * Decode event log data using ABI
 * Looks up event by topic0 (event signature hash) for non-anonymous events,
 * or by indexed parameter count for anonymous events.
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {Object} log - Log object with data and topics
 * @param {import("../Hex/index.js").HexType | Uint8Array} log.data - Log data bytes
 * @param {readonly (import("../Hex/index.js").HexType | Uint8Array)[]} log.topics - Log topics (topic0 is event selector for non-anonymous)
 * @returns {{ event: string, params: Record<string, unknown> }} Decoded event name and parameters
 * @throws {AbiItemNotFoundError} If event not found in ABI
 *
 * @example
 * ```typescript
 * const abi = [
 *   {
 *     type: "event",
 *     name: "Transfer",
 *     inputs: [
 *       { type: "address", name: "from", indexed: true },
 *       { type: "address", name: "to", indexed: true },
 *       { type: "uint256", name: "value", indexed: false }
 *     ]
 *   }
 * ];
 * const log = {
 *   data: "0x0000000000000000000000000000000000000000000000000000000000000064",
 *   topics: [
 *     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
 *     "0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3",
 *     "0x000000000000000000000000a1b2c3d4e5f6789012345678901234567890abcd"
 *   ]
 * };
 * const decoded = Abi.decodeLog(abi, log);
 * // { event: "Transfer", params: { from: "0x742d...", to: "0xa1b2...", value: 100n } }
 * ```
 */
export function decodeLog(abi, log) {
	const dataBytes =
		typeof log.data === "string" ? Hex.toBytes(log.data) : log.data;
	const topicBytes = log.topics.map((t) =>
		typeof t === "string" ? Hex.toBytes(t) : t,
	);

	const abiItems = /** @type {import('./AbiType.js').Item[]} */ (
		/** @type {unknown} */ (abi)
	);

	// For logs with topics, first try to find non-anonymous event by selector
	if (topicBytes.length > 0) {
		const topic0 = topicBytes[0];
		if (topic0) {
			// Find non-anonymous event by selector
			const item = abiItems.find(
				(/** @type {import('./AbiType.js').Item} */ item) => {
					if (item.type !== "event") return false;
					const evt = /** @type {import('./event/index.js').Event} */ (item);
					if (evt.anonymous) return false;

					const eventSelector = Event.getSelector(evt);
					for (let i = 0; i < 32; i++) {
						if (topic0[i] !== eventSelector[i]) return false;
					}
					return true;
				},
			);

			if (item && item.type === "event") {
				const evt = /** @type {import('./event/index.js').Event} */ (item);
				const params = Event.decodeLog(
					evt,
					dataBytes,
					/** @type {any} */ (topicBytes),
				);
				return { event: evt.name, params };
			}
		}
	}

	// Try to find anonymous event by indexed parameter count
	// For anonymous events, all topics are indexed parameters (no selector)
	const indexedCount = topicBytes.length;
	const anonymousEvents = abiItems.filter(
		(/** @type {import('./AbiType.js').Item} */ item) => {
			if (item.type !== "event") return false;
			const evt = /** @type {import('./event/index.js').Event} */ (item);
			return evt.anonymous && countIndexedParams(evt) === indexedCount;
		},
	);

	if (anonymousEvents.length === 1) {
		const evt = /** @type {import('./event/index.js').Event} */ (
			anonymousEvents[0]
		);
		const params = Event.decodeLog(
			evt,
			dataBytes,
			/** @type {any} */ (topicBytes),
		);
		return { event: evt.name, params };
	}

	if (anonymousEvents.length > 1) {
		throw new AbiItemNotFoundError(
			`Multiple anonymous events match ${indexedCount} indexed parameters: ${anonymousEvents.map((e) => /** @type {import('./event/index.js').Event} */ (e).name).join(", ")}`,
			{
				value: indexedCount,
				expected: "unique anonymous event match",
				context: {
					matchingEvents: anonymousEvents.map(
						(e) => /** @type {import('./event/index.js').Event} */ (e).name,
					),
					topicsLength: topicBytes.length,
				},
			},
		);
	}

	// No match found
	if (topicBytes.length === 0) {
		throw new AbiItemNotFoundError(
			"No topics in log and no matching anonymous events found",
			{
				value: 0,
				expected: "at least one topic or matching anonymous event",
				context: { log },
			},
		);
	}

	const topic0 = topicBytes[0];
	throw new AbiItemNotFoundError(
		`Event with selector ${topic0 ? Hex.fromBytes(topic0) : "undefined"} not found in ABI`,
		{
			value: topic0 ? Hex.fromBytes(topic0) : "undefined",
			expected: "valid event selector in ABI",
			context: { selector: topic0 ? Hex.fromBytes(topic0) : "undefined", abi },
		},
	);
}
