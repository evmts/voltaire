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
export function decodeLog(abi: import("./Abi.js").Abi, log: {
    data: import("../Hex/index.js").HexType | Uint8Array;
    topics: readonly (import("../Hex/index.js").HexType | Uint8Array)[];
}): {
    event: string;
    params: Record<string, unknown>;
};
//# sourceMappingURL=decodeLog.d.ts.map