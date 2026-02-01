/**
 * Convert address to 32-byte key format (prepend 12 zero bytes)
 *
 * @param {Uint8Array} addr - 20-byte Ethereum address
 * @returns {Uint8Array} 32-byte key
 * @throws {InvalidAddressLengthError} If address is not 20 bytes
 *
 * @example
 * ```typescript
 * const addr = new Uint8Array(20);
 * const key = BinaryTree.addressToKey(addr);
 * console.log(key.length); // 32
 * ```
 */
export function addressToKey(addr: Uint8Array): Uint8Array;
//# sourceMappingURL=addressToKey.d.ts.map