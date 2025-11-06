import * as Hex from "../../Hex/index.js";
import * as Event from "../event/index.js";

/**
 * Parse event logs (branded ABI method)
 *
 * @this {import('./BrandedAbi.js').BrandedAbi}
 * @param {readonly { data: Uint8Array | string, topics: readonly (Uint8Array | string)[] }[]} logs - Array of log objects
 * @returns {readonly { eventName: string, args: Record<string, unknown> }[]} Parsed event logs
 *
 * @example
 * ```typescript
 * const abi = [...];
 * const parsed = Abi.parseLogs.call(abi, logs);
 * // [{ eventName: "Transfer", args: { from, to, value } }]
 * ```
 */
export function parseLogs(logs) {
	return logs
		.map((log) => {
			const dataBytes =
				typeof log.data === "string" ? Hex.toBytes(log.data) : log.data;
			const topicBytes = log.topics.map((/** @type {Uint8Array | string} */ t) =>
				typeof t === "string" ? Hex.toBytes(t) : t,
			);

			if (topicBytes.length === 0) {
				return null; // Skip anonymous events
			}

			const topic0 = topicBytes[0];
			if (!topic0) {
				return null;
			}

			// Find event by selector (topic0 for non-anonymous events)
			const event = /** @type {import('../event/BrandedEvent.js').Event<string, readonly import('../Parameter.js').Parameter[]> | undefined} */ (
				this.find((item) => {
					if (item.type !== "event") return false;
					if (item.anonymous) return false;

					const eventSelector = Event.getSelector(item);
					// Compare bytes
					for (let i = 0; i < 32; i++) {
						if (topic0[i] !== eventSelector[i]) return false;
					}
					return true;
				})
			);

			if (!event) {
				return null; // Skip unknown events
			}

			try {
				// Cast topicBytes to BrandedHash[] for Event.decodeLog
				const args = Event.decodeLog(
					event,
					dataBytes,
					/** @type {readonly import('../../Hash/index.js').BrandedHash[]} */ (
						/** @type {unknown} */ (topicBytes)
					),
				);
				return {
					eventName: event.name,
					args,
				};
			} catch {
				return null; // Skip malformed logs
			}
		})
		.filter((result) => result !== null);
}
