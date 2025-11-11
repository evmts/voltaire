import * as Hex from "../Hex/index.js";
import { AbiItemNotFoundError } from "./Errors.js";
import * as Event from "./event/index.js";

/**
 * Decode event log data using ABI
 * Looks up event by topic0 (event signature hash) and decodes indexed + non-indexed parameters
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {Object} log - Log object with data and topics
 * @param {import("../Hex/BrandedHex/BrandedHex.js").BrandedHex | Uint8Array} log.data - Log data bytes
 * @param {readonly (import("../Hex/BrandedHex/BrandedHex.js").BrandedHex | Uint8Array)[]} log.topics - Log topics (topic0 is event selector)
 * @returns {{ event: string, params: Record<string, unknown> }} Decoded event name and parameters
 * @throws {AbiItemNotFoundError} If no topics, missing topic0, or event not found in ABI
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

	if (topicBytes.length === 0) {
		throw new AbiItemNotFoundError(
			"No topics in log (anonymous events not yet supported)",
			{
				value: topicBytes.length,
				expected: "at least one topic",
				context: { log },
			},
		);
	}

	const topic0 = topicBytes[0];
	if (!topic0) {
		throw new AbiItemNotFoundError("Missing topic0", {
			value: topic0,
			expected: "valid topic0",
			context: { topics: topicBytes },
		});
	}

	// Find event by selector (topic0 for non-anonymous events)
	const item = abi.find((item) => {
		if (item.type !== "event") return false;
		const evt = /** @type {import('./event/index.js').Event} */ (item);
		if (evt.anonymous) return false; // Skip anonymous events for now

		const eventSelector = Event.getSelector(evt);
		// Compare bytes
		for (let i = 0; i < 32; i++) {
			if (topic0[i] !== eventSelector[i]) return false;
		}
		return true;
	});

	if (!item || item.type !== "event") {
		throw new AbiItemNotFoundError(
			`Event with selector ${Hex.fromBytes(topic0)} not found in ABI`,
			{
				value: Hex.fromBytes(topic0),
				expected: "valid event selector in ABI",
				context: { selector: Hex.fromBytes(topic0), abi },
			},
		);
	}

	// Type assertion after guard
	const evt = /** @type {import('./event/index.js').Event} */ (item);
	const params = Event.decodeLog(
		evt,
		dataBytes,
		/** @type {any} */ (topicBytes),
	);

	return {
		event: evt.name,
		params,
	};
}
