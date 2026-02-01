/**
 * Decode function call data and identify function (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./AbiType.js').AbiType}
 * @param {Uint8Array} data - Encoded function call data
 * @returns {{ functionName: string, args: readonly unknown[] }} Decoded function name and arguments
 * @throws {AbiInvalidSelectorError} If data is too short to contain selector
 * @throws {AbiItemNotFoundError} If function with selector not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'transfer', inputs: [...] }];
 * const decoded = Abi.decodeData(abi, calldata);
 * // { functionName: "transfer", args: [address, amount] }
 * ```
 */
export function decodeData(this: readonly import("./AbiType.js").Item[], data: Uint8Array): {
    functionName: string;
    args: readonly unknown[];
};
//# sourceMappingURL=decodeData.d.ts.map