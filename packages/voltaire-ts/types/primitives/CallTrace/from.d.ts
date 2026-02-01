/**
 * Creates a CallTrace from raw data
 *
 * @param {object} data - CallTrace data
 * @param {"CALL"|"STATICCALL"|"DELEGATECALL"|"CALLCODE"|"CREATE"|"CREATE2"|"SELFDESTRUCT"} data.type - Call type
 * @param {import('../Address/AddressType.js').AddressType} data.from - Caller address
 * @param {import('../Address/AddressType.js').AddressType} [data.to] - Callee address
 * @param {import('../Uint/Uint256Type.js').Uint256Type} [data.value] - Call value
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gas - Gas provided
 * @param {import('../Uint/Uint256Type.js').Uint256Type} data.gasUsed - Gas used
 * @param {Uint8Array} data.input - Input data
 * @param {Uint8Array} data.output - Output data
 * @param {string} [data.error] - Error message
 * @param {string} [data.revertReason] - Decoded revert reason
 * @param {readonly import('./CallTraceType.js').CallTraceType[]} [data.calls] - Nested calls
 * @returns {import('./CallTraceType.js').CallTraceType} CallTrace instance
 * @example
 * ```javascript
 * import { from } from './from.js';
 * const trace = from({
 *   type: "CALL",
 *   from: fromAddress,
 *   to: toAddress,
 *   gas: 100000n,
 *   gasUsed: 50000n,
 *   input: new Uint8Array(),
 *   output: new Uint8Array()
 * });
 * ```
 */
export function from(data: {
    type: "CALL" | "STATICCALL" | "DELEGATECALL" | "CALLCODE" | "CREATE" | "CREATE2" | "SELFDESTRUCT";
    from: import("../Address/AddressType.js").AddressType;
    to?: import("../Address/AddressType.js").AddressType | undefined;
    value?: import("../Uint/Uint256Type.js").Uint256Type | undefined;
    gas: import("../Uint/Uint256Type.js").Uint256Type;
    gasUsed: import("../Uint/Uint256Type.js").Uint256Type;
    input: Uint8Array;
    output: Uint8Array;
    error?: string | undefined;
    revertReason?: string | undefined;
    calls?: readonly import("./CallTraceType.js").CallTraceType[] | undefined;
}): import("./CallTraceType.js").CallTraceType;
//# sourceMappingURL=from.d.ts.map