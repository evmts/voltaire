/**
 * Compute EIP-712 domain separator hash
 *
 * @param {import('./DomainType.js').DomainType} domain - Domain
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {import('../DomainSeparator/DomainSeparatorType.js').DomainSeparatorType} Domain separator hash
 * @example
 * ```javascript
 * import { keccak256 } from './crypto/Keccak256/index.js';
 * const domainSep = Domain.toHash(domain, { keccak256 });
 * ```
 */
export function toHash(domain: import("./DomainType.js").DomainType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): import("../DomainSeparator/DomainSeparatorType.js").DomainSeparatorType;
//# sourceMappingURL=toHash.d.ts.map