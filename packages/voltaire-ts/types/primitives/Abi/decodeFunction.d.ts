/**
 * Decode function call data using ABI
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {import("../Hex/index.js").HexType | Uint8Array} data - Encoded function call data
 * @returns {{ name: string, params: readonly unknown[] }} Decoded function name and parameters
 * @throws {AbiInvalidSelectorError} If data too short for selector
 * @throws {AbiItemNotFoundError} If function selector not found in ABI
 *
 * @example
 * ```typescript
 * const abi = [
 *   {
 *     type: "function",
 *     name: "transfer",
 *     inputs: [
 *       { type: "address", name: "to" },
 *       { type: "uint256", name: "amount" }
 *     ]
 *   }
 * ];
 * const decoded = Abi.decodeFunction(abi, "0xa9059cbb...");
 * // { name: "transfer", params: ["0x742d35...", 100n] }
 * ```
 */
export function decodeFunction(abi: import("./Abi.js").Abi, data: import("../Hex/index.js").HexType | Uint8Array): {
    name: string;
    params: readonly unknown[];
};
//# sourceMappingURL=decodeFunction.d.ts.map