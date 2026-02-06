/**
 * Parse implementation address from ERC-1167 minimal proxy bytecode
 * Extracts the 20-byte implementation address from the proxy bytecode
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} bytecode - Proxy bytecode (45 or 55 bytes)
 * @returns {Uint8Array | null} 20-byte implementation address or null if invalid
 */
export function parseErc1167(bytecode: Uint8Array): Uint8Array | null;
//# sourceMappingURL=parseErc1167.d.ts.map