/**
 * Calculate ERC-5267 field bitmap
 *
 * Returns 1-byte value where each bit indicates presence of a field:
 * - 0x01: name
 * - 0x02: version
 * - 0x04: chainId
 * - 0x08: verifyingContract
 * - 0x10: salt
 * - 0x20: extensions
 *
 * @param {import('./DomainType.js').DomainType} domain - EIP-712 domain
 * @returns {Uint8Array} - 1-byte bitmap
 *
 * @see https://eips.ethereum.org/EIPS/eip-5267
 *
 * @example
 * ```javascript
 * const domain = { name: "Test", version: "1", chainId: 1n };
 * const bitmap = getFieldsBitmap(domain);
 * // bitmap[0] === 0x07 (name + version + chainId bits set)
 * ```
 */
export function getFieldsBitmap(domain: import("./DomainType.js").DomainType): Uint8Array;
//# sourceMappingURL=getFieldsBitmap.d.ts.map