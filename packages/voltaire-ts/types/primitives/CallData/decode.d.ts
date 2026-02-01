/**
 * Decoded calldata structure
 * @typedef {Object} CallDataDecoded
 * @property {Uint8Array} selector - 4-byte function selector
 * @property {string | null} signature - Human-readable function signature (if ABI provided)
 * @property {unknown[]} parameters - Decoded parameter values
 */
/**
 * Decode CallData to structured form
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to decode
 * @param {import('../Abi/AbiType.js').AbiType} abi - ABI specification with function definitions
 * @returns {CallDataDecoded} Decoded structure with selector, signature, and parameters
 * @throws {AbiItemNotFoundError} If function not found in ABI for the given selector
 *
 * @example
 * ```javascript
 * const abi = [{
 *   name: "transfer",
 *   type: "function",
 *   inputs: [
 *     { name: "to", type: "address" },
 *     { name: "amount", type: "uint256" }
 *   ]
 * }];
 *
 * const decoded = CallData.decode(calldata, abi);
 * console.log(decoded.signature); // "transfer(address,uint256)"
 * console.log(decoded.parameters[0]); // "0x..."
 * console.log(decoded.parameters[1]); // bigint
 * ```
 */
export function decode(calldata: import("./CallDataType.js").CallDataType, abi: import("../Abi/AbiType.js").AbiType): CallDataDecoded;
/**
 * Decoded calldata structure
 */
export type CallDataDecoded = {
    /**
     * - 4-byte function selector
     */
    selector: Uint8Array;
    /**
     * - Human-readable function signature (if ABI provided)
     */
    signature: string | null;
    /**
     * - Decoded parameter values
     */
    parameters: unknown[];
};
//# sourceMappingURL=decode.d.ts.map