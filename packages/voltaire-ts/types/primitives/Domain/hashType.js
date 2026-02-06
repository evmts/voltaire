import { encodeType } from "./encodeType.js";
/**
 * Hash EIP-712 type definition
 *
 * typeHash = keccak256(encodeType(primaryType, types))
 *
 * @param {string} primaryType - Primary type name
 * @param {Record<string, readonly import('./DomainType.js').EIP712Field[]>} types - Type definitions
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Type hash (32 bytes)
 */
export function hashType(primaryType, types, crypto) {
    const typeString = encodeType(primaryType, types);
    return crypto.keccak256(new TextEncoder().encode(typeString));
}
