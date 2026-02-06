/**
 * Compare two addresses lexicographically
 *
 * @param {import('./AddressType.js').AddressType} address - First address
 * @param {import('./AddressType.js').AddressType} other - Address to compare with
 * @returns {number} -1 if address < other, 0 if equal, 1 if address > other
 *
 * @example
 * ```typescript
 * const sorted = addresses.sort((a, b) => Address.compare(a, b));
 * ```
 */
export function compare(address: import("./AddressType.js").AddressType, other: import("./AddressType.js").AddressType): number;
//# sourceMappingURL=compare.d.ts.map