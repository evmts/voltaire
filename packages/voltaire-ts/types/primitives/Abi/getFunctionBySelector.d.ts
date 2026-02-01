/**
 * Find function in ABI by selector
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {import("../Hex/index.js").HexType | Uint8Array} selector - 4-byte function selector
 * @returns {import('./function/FunctionType.js').FunctionType} Function ABI item
 * @throws {AbiItemNotFoundError} If selector invalid length or function not found in ABI
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
 * const func = Abi.getFunctionBySelector(abi, "0xa9059cbb");
 * // { type: "function", name: "transfer", ... }
 * ```
 */
export function getFunctionBySelector(abi: import("./Abi.js").Abi, selector: import("../Hex/index.js").HexType | Uint8Array): import("./function/FunctionType.js").FunctionType;
//# sourceMappingURL=getFunctionBySelector.d.ts.map