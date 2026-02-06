/**
 * Compute EIP-712 typed data hash for signing
 *
 * hash = keccak256("\x19\x01" || domainSeparator || messageHash)
 *
 * @param {import('./TypedDataType.js').TypedDataType} typedData - TypedData
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {import('../Hash/HashType.js').HashType} Hash for signing
 * @throws {import('../Domain/errors.js').InvalidDomainTypeError} If type is not found
 * @throws {import('../Domain/errors.js').InvalidEIP712ValueError} If value encoding fails
 * @example
 * ```javascript
 * import { keccak256 } from './crypto/Keccak256/index.js';
 * const hash = TypedData.hash(typedData, { keccak256 });
 * const signature = await wallet.signMessage(hash);
 * ```
 */
export function hash(typedData: import("./TypedDataType.js").TypedDataType, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): import("../Hash/HashType.js").HashType;
//# sourceMappingURL=hash.d.ts.map