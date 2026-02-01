/**
 * Generate ERC-1167 minimal proxy bytecode
 * Creates the 55-byte creation code and 45-byte runtime code for a minimal proxy
 * @see https://eips.ethereum.org/EIPS/eip-1167
 * @param {Uint8Array} implementationAddress - 20-byte implementation address
 * @returns {Uint8Array} 55-byte creation code
 */
export function generateErc1167(implementationAddress: Uint8Array): Uint8Array;
//# sourceMappingURL=generateErc1167.d.ts.map