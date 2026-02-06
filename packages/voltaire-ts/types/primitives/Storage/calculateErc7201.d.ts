/**
 * Calculate ERC-7201 namespaced storage slot
 * Formula: keccak256(keccak256(id) - 1) & ~0xff
 * The result has the last byte cleared (set to 0x00)
 * @see https://eips.ethereum.org/EIPS/eip-7201
 * @param {(data: Uint8Array) => Uint8Array} keccak256 - Keccak256 hash function
 * @param {string} id - Namespace identifier string
 * @returns {Uint8Array} 32-byte storage slot
 */
export function calculateErc7201(keccak256: (data: Uint8Array) => Uint8Array, id: string): Uint8Array;
//# sourceMappingURL=calculateErc7201.d.ts.map