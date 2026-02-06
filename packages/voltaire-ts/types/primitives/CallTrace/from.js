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
export function from(data) {
    return /** @type {import('./CallTraceType.js').CallTraceType} */ ({
        type: data.type,
        from: data.from,
        ...(data.to !== undefined && { to: data.to }),
        ...(data.value !== undefined && { value: data.value }),
        gas: data.gas,
        gasUsed: data.gasUsed,
        input: data.input,
        output: data.output,
        ...(data.error !== undefined && { error: data.error }),
        ...(data.revertReason !== undefined && { revertReason: data.revertReason }),
        ...(data.calls !== undefined && { calls: data.calls }),
    });
}
