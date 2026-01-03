import * as Hex from "../Hex/index.js";
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
 * Parse event logs (branded ABI method)
 * Supports both regular events (matched by topic0 selector) and anonymous events
 * (matched by indexed parameter count when unique).
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./AbiType.js').AbiType}
 * @param {readonly { data: Uint8Array | string, topics: readonly (Uint8Array | string)[] }[]} logs - Array of log objects
 * @returns {readonly { eventName: string, args: Record<string, unknown> }[]} Parsed event logs
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'event', name: 'Transfer', inputs: [...] }];
 * const parsed = Abi.parseLogs(abi, logs);
 * // [{ eventName: "Transfer", args: { from, to, value } }]
 * ```
 */
export function parseLogs(logs) {
	return logs
		.map((log) => {
			const dataBytes =
				typeof log.data === "string" ? Hex.toBytes(log.data) : log.data;
			const topicBytes = log.topics.map(
				(/** @type {Uint8Array | string} */ t) =>
					typeof t === "string" ? Hex.toBytes(t) : t,
			);

			// First try to find non-anonymous event by selector
			if (topicBytes.length > 0) {
				const topic0 = topicBytes[0];
				if (topic0) {
					const event =
						/** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]> | undefined} */ (
							this.find((item) => {
								if (item.type !== "event") return false;
								if (item.anonymous) return false;

								const eventSelector = Event.getSelector(item);
								for (let i = 0; i < 32; i++) {
									if (topic0[i] !== eventSelector[i]) return false;
								}
								return true;
							})
						);

					if (event) {
						try {
							const args = Event.decodeLog(
								event,
								dataBytes,
								/** @type {readonly import('../Hash/index.js').HashType[]} */ (
									/** @type {unknown} */ (topicBytes)
								),
							);
							return { eventName: event.name, args };
						} catch {
							return null;
						}
					}
				}
			}

			// Try to find anonymous event by indexed parameter count
			const indexedCount = topicBytes.length;
			const anonymousEvents =
				/** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>[]} */ (
					this.filter((item) => {
						if (item.type !== "event") return false;
						if (!item.anonymous) return false;
						return countIndexedParams(item) === indexedCount;
					})
				);

			// Only decode if there's exactly one matching anonymous event
			if (anonymousEvents.length === 1 && anonymousEvents[0]) {
				const event = anonymousEvents[0];
				try {
					const args = Event.decodeLog(
						event,
						dataBytes,
						/** @type {readonly import('../Hash/index.js').HashType[]} */ (
							/** @type {unknown} */ (topicBytes)
						),
					);
					return { eventName: event.name, args };
				} catch {
					return null;
				}
			}

			return null; // Skip unknown or ambiguous events
		})
		.filter((result) => result !== null);
}
