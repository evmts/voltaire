/**
 * @typedef {{ readonly name: string; readonly type: string }} EIP712Field
 * @typedef {Record<string, readonly EIP712Field[]>} EIP712Types
 */
/**
 * Encode EIP-712 data structure
 *
 * encodeData(primaryType, data, types) = encodeType(primaryType, types) || encodeValue(data)
 *
 * @param {string} primaryType - Primary type name
 * @param {any} data - Data object
 * @param {EIP712Types} types - Type definitions
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded data
 * @throws {InvalidDomainTypeError} If type is not found in types
 */
export function encodeData(primaryType: string, data: any, types: EIP712Types, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export type EIP712Field = {
    readonly name: string;
    readonly type: string;
};
export type EIP712Types = Record<string, readonly EIP712Field[]>;
//# sourceMappingURL=encodeData.d.ts.map