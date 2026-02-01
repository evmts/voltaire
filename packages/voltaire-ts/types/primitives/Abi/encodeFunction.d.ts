/**
 * Encode function call data from ABI by function name
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {string} functionName - Function name to encode
 * @param {readonly unknown[]} args - Function arguments
 * @returns {import("../Hex/index.js").HexType} Encoded function call data (hex string)
 * @throws {AbiItemNotFoundError} If function not found in ABI
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
 * const encoded = Abi.encodeFunction(abi, "transfer", [
 *   "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
 *   100n
 * ]);
 * ```
 */
export function encodeFunction(abi: import("./Abi.js").Abi, functionName: string, args: readonly unknown[]): import("../Hex/index.js").HexType;
//# sourceMappingURL=encodeFunction.d.ts.map