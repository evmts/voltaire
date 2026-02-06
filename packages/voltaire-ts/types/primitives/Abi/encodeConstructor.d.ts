/**
 * Encode constructor deployment data from ABI
 *
 * @param {import('./Abi.js').Abi} abi - Full ABI array
 * @param {readonly unknown[]} args - Constructor arguments
 * @returns {import("../Hex/index.js").HexType} Encoded constructor parameters (hex string)
 * @throws {AbiItemNotFoundError} If constructor not found in ABI
 *
 * @example
 * ```typescript
 * const abi = [
 *   {
 *     type: "constructor",
 *     inputs: [
 *       { type: "string", name: "name" },
 *       { type: "string", name: "symbol" }
 *     ]
 *   }
 * ];
 * const encoded = Abi.encodeConstructor(abi, ["MyToken", "MTK"]);
 * // This is appended to bytecode for deployment
 * ```
 */
export function encodeConstructor(abi: import("./Abi.js").Abi, args: readonly unknown[]): import("../Hex/index.js").HexType;
//# sourceMappingURL=encodeConstructor.d.ts.map