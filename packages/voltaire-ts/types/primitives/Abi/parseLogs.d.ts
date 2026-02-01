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
export function parseLogs(this: readonly import("./AbiType.js").Item[], logs: readonly {
    data: Uint8Array | string;
    topics: readonly (Uint8Array | string)[];
}[]): readonly {
    eventName: string;
    args: Record<string, unknown>;
}[];
//# sourceMappingURL=parseLogs.d.ts.map