/**
 * Decode event log data and topics into event arguments
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./EventType.js').EventType} event - Event definition
 * @param {Uint8Array} data - Log data bytes
 * @param {readonly import('../../Hash/index.js').HashType[]} topics - Log topics
 * @returns {import('./EventType.js').DecodeLogResult<any>} Decoded event arguments
 * @throws {AbiDecodingError} If topics are missing or invalid
 * @throws {AbiInvalidSelectorError} If event selector doesn't match topic0
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const event = { type: "event", name: "Transfer", inputs: [
 *   { type: "address", name: "from", indexed: true },
 *   { type: "address", name: "to", indexed: true },
 *   { type: "uint256", name: "value" }
 * ]};
 * const decoded = Abi.Event.decodeLog(event, logData, logTopics);
 * // { from: "0x...", to: "0x...", value: 1000n }
 * ```
 */
export function decodeLog(event: import("./EventType.js").EventType, data: Uint8Array, topics: readonly import("../../Hash/index.js").HashType[]): import("./EventType.js").DecodeLogResult<any>;
//# sourceMappingURL=decodeLog.d.ts.map