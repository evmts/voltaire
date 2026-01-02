import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Event from "./event/index.js";

/**
 * Decode event log data using ABI
 * Looks up event by topic0 (event signature hash) for non-anonymous events,
 * or tries to match anonymous events by indexed parameter count.
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {Object} log - Log object with data and topics
 * @param {import("../Hex/index.js").HexType | Uint8Array} log.data - Log data bytes
 * @param {readonly (import("../Hex/index.js").HexType | Uint8Array)[]} log.topics - Log topics (topic0 is event selector for non-anonymous)
 * @param {Object} [options] - Decoding options
 * @param {string} [options.eventName] - Event name hint for anonymous events (helps disambiguate)
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
 *
 * @example Anonymous event
 * ```typescript
 * const abi = [
 *   {
 *     type: "event",
 *     name: "AnonymousTransfer",
 *     anonymous: true,
 *     inputs: [
 *       { type: "address", name: "from", indexed: true },
 *       { type: "uint256", name: "value", indexed: false }
 *     ]
 *   }
 * ];
 * // Anonymous event has no topic0 selector, only indexed params as topics
 * const log = {
 *   data: "0x...",
 *   topics: ["0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3"]
 * };
 * const decoded = Abi.decodeLog(abi, log, { eventName: "AnonymousTransfer" });
 * ```
 */
export function decodeLog(abi, log, options = {}) {
	const dataBytes =
		typeof log.data === "string" ? Hex.toBytes(log.data) : log.data;
	const topicBytes = log.topics.map((t) =>
		typeof t === "string" ? Hex.toBytes(t) : t,
	);

	const abiItems = /** @type {import('./AbiType.js').Item[]} */ (
		/** @type {unknown} */ (abi)
	);

	// First, try to find non-anonymous event by selector (topic0)
	if (topicBytes.length > 0 && topicBytes[0]) {
		const topic0 = topicBytes[0];
		const nonAnonEvent = abiItems.find(
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

		if (nonAnonEvent && nonAnonEvent.type === "event") {
			const evt = /** @type {import('./event/index.js').Event} */ (nonAnonEvent);
			const params = Event.decodeLog(
				evt,
				dataBytes,
				/** @type {any} */ (topicBytes),
			);
			return { event: evt.name, params };
		}
	}

	// Try to find anonymous event
	// Anonymous events don't have topic0 as selector, all topics are indexed params
	const anonymousEvents = abiItems.filter(
		(/** @type {import('./AbiType.js').Item} */ item) => {
			if (item.type !== "event") return false;
			const evt = /** @type {import('./event/index.js').Event} */ (item);
			return evt.anonymous === true;
		},
	);

	// If eventName hint provided, use it to find the event
	if (options.eventName) {
		const namedAnon = anonymousEvents.find(
			(evt) =>
				/** @type {import('./event/index.js').Event} */ (evt).name ===
				options.eventName,
		);
		if (namedAnon && namedAnon.type === "event") {
			const evt = /** @type {import('./event/index.js').Event} */ (namedAnon);
			const params = Event.decodeLog(
				evt,
				dataBytes,
				/** @type {any} */ (topicBytes),
			);
			return { event: evt.name, params };
		}
	}

	// Try to match anonymous event by indexed parameter count
	for (const item of anonymousEvents) {
		const evt = /** @type {import('./event/index.js').Event} */ (item);
		const indexedCount = evt.inputs.filter(
			(/** @type {{ indexed?: boolean }} */ p) => p.indexed,
		).length;

		// For anonymous events, all topics are indexed params (no selector)
		if (indexedCount === topicBytes.length) {
			try {
				const params = Event.decodeLog(
					evt,
					dataBytes,
					/** @type {any} */ (topicBytes),
				);
				return { event: evt.name, params };
			} catch {
				// Try next anonymous event if decoding fails
				continue;
			}
		}
	}

	// No event found
	if (topicBytes.length === 0) {
		throw new AbiItemNotFoundError(
			"No topics in log and no matching anonymous event found",
			{
				value: topicBytes.length,
				expected: "at least one topic or matching anonymous event",
				context: { log, anonymousEventCount: anonymousEvents.length },
			},
		);
	}

	const topic0 = topicBytes[0];
	throw new AbiItemNotFoundError(
		`Event with selector ${topic0 ? Hex.fromBytes(topic0) : "unknown"} not found in ABI`,
		{
			value: topic0 ? Hex.fromBytes(topic0) : "no topics",
			expected: "valid event selector in ABI",
			context: { selector: topic0 ? Hex.fromBytes(topic0) : null, abi },
		},
	);
}
