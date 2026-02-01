/**
 * Encode function call data (branded ABI method)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @this {import('./AbiType.js').AbiType}
 * @param {string} functionName - Function name to encode
 * @param {readonly unknown[]} args - Function arguments
 * @returns {Uint8Array} Encoded function call data
 * @throws {AbiItemNotFoundError} If function not found in ABI
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const abi = [{ type: 'function', name: 'transfer', inputs: [...] }];
 * const encoded = Abi.encode(abi, "transfer", [address, amount]);
 * ```
 */
export function encode(this: readonly import("./AbiType.js").Item[], functionName: string, args: readonly unknown[]): Uint8Array;
//# sourceMappingURL=encode.d.ts.map