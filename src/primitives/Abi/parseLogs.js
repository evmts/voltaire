import * as Hex from "../Hex/index.js";
import * as Event from "./event/index.js";

/**
 * Parse event logs (branded ABI method)
 * Handles both regular events (topic0 = selector) and anonymous events (no selector in topics)
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

			const topic0 = topicBytes[0];

			// First try non-anonymous events (topic0 = selector)
			if (topic0) {
				const nonAnonEvent =
					/** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]> | undefined} */ (
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

				if (nonAnonEvent) {
					try {
						const args = Event.decodeLog(
							nonAnonEvent,
							dataBytes,
							/** @type {readonly import('../Hash/index.js').HashType[]} */ (
								/** @type {unknown} */ (topicBytes)
							),
						);
						return {
							eventName: nonAnonEvent.name,
							args,
						};
					} catch {
						// Continue to try anonymous events
					}
				}
			}

			// Try anonymous events
			// Anonymous events don't have topic0 as selector, all topics are indexed params
			const anonymousEvents =
				/** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>[]} */ (
					this.filter((item) => item.type === "event" && item.anonymous === true)
				);

			for (const anonEvent of anonymousEvents) {
				const indexedCount = anonEvent.inputs.filter((p) => p.indexed).length;

				// For anonymous events, all topics are indexed params (no selector)
				if (indexedCount === topicBytes.length) {
					try {
						const args = Event.decodeLog(
							anonEvent,
							dataBytes,
							/** @type {readonly import('../Hash/index.js').HashType[]} */ (
								/** @type {unknown} */ (topicBytes)
							),
						);
						return {
							eventName: anonEvent.name,
							args,
						};
					} catch {
						// Try next anonymous event
						continue;
					}
				}
			}

			return null; // Skip unknown/malformed logs
		})
		.filter((result) => result !== null);
}
