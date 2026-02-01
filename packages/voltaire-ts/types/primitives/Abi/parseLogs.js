import * as Hex from "../Hex/index.js";
import * as Event from "./event/index.js";
/**
 * Count indexed parameters in an event
 * @param {import('./event/index.js').Event} event
 * @returns {number}
 */
function countIndexedParams(event) {
    return event.inputs.filter((/** @type {{ indexed?: boolean }} */ p) => p.indexed).length;
}
/**
 * Normalize log values into bytes.
 * @param {Uint8Array | string} value
 * @returns {Uint8Array}
 */
function toBytes(value) {
    return typeof value === "string" ? Hex.toBytes(value) : value;
}
/**
 * Match event selector against topic0.
 * @param {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>} event
 * @param {Uint8Array} topic0
 * @returns {boolean}
 */
function matchesSelector(event, topic0) {
    const eventSelector = Event.getSelector(event);
    for (let i = 0; i < 32; i++) {
        if (topic0[i] !== eventSelector[i])
            return false;
    }
    return true;
}
/**
 * Find a non-anonymous event by topic0 selector.
 * @param {import('./AbiType.js').AbiType} abi
 * @param {Uint8Array} topic0
 * @returns {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]> | undefined}
 */
function findEventBySelector(abi, topic0) {
    const event = abi.find((item) => {
        if (item.type !== "event" || item.anonymous)
            return false;
        return matchesSelector(
        /** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>} */ (item), topic0);
    });
    return /** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]> | undefined} */ (event);
}
/**
 * Find a unique anonymous event by indexed param count.
 * @param {import('./AbiType.js').AbiType} abi
 * @param {number} indexedCount
 * @returns {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]> | null}
 */
function findAnonymousEvent(abi, indexedCount) {
    const matches = abi.filter((item) => {
        if (item.type !== "event" || !item.anonymous)
            return false;
        return (countIndexedParams(
        /** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>} */ (item)) === indexedCount);
    });
    return matches.length === 1 && matches[0]
        ? /** @type {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>} */ (matches[0])
        : null;
}
/**
 * Decode a log payload with an event definition.
 * @param {import('./event/EventType.js').EventType<string, readonly import('./parameter/index.js').AbiParameter[]>} event
 * @param {Uint8Array} dataBytes
 * @param {readonly Uint8Array[]} topicBytes
 * @returns {{ eventName: string, args: Record<string, unknown> } | null}
 */
function decodeLogSafe(event, dataBytes, topicBytes) {
    try {
        const args = Event.decodeLog(event, dataBytes, 
        /** @type {readonly import('../Hash/index.js').HashType[]} */ (
        /** @type {unknown} */ (topicBytes)));
        return { eventName: event.name, args };
    }
    catch {
        return null;
    }
}
/**
 * Parse a single log entry.
 * @param {import('./AbiType.js').AbiType} abi
 * @param {{ data: Uint8Array | string, topics: readonly (Uint8Array | string)[] }} log
 * @returns {{ eventName: string, args: Record<string, unknown> } | null}
 */
function parseLogEntry(abi, log) {
    const dataBytes = toBytes(log.data);
    const topicBytes = log.topics.map(toBytes);
    if (topicBytes.length > 0) {
        const topic0 = topicBytes[0];
        if (topic0) {
            const event = findEventBySelector(abi, topic0);
            const decoded = event
                ? decodeLogSafe(event, dataBytes, topicBytes)
                : null;
            if (decoded)
                return decoded;
        }
    }
    const anonymousEvent = findAnonymousEvent(abi, topicBytes.length);
    return anonymousEvent
        ? decodeLogSafe(anonymousEvent, dataBytes, topicBytes)
        : null;
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
        .map((log) => parseLogEntry(this, log))
        .filter((result) => result !== null);
}
