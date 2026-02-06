/**
 * Decode function return values (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./AbiType.js').AbiType}
 * @param {string} functionName - Function name
 * @param {Uint8Array} data - Encoded return data
 * @returns {readonly unknown[]} Decoded return values
 * @throws {AbiItemNotFoundError} If function not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'balanceOf', outputs: [...] }];
 * const decoded = Abi.decode(abi, "balanceOf", encodedData);
 * ```
 */
export function decode(this: readonly import("./AbiType.js").Item[], functionName: string, data: Uint8Array): readonly unknown[];
//# sourceMappingURL=decode.d.ts.map