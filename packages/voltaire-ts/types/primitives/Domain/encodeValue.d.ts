/**
 * @typedef {{ readonly name: string; readonly type: string }} EIP712Field
 * @typedef {Record<string, readonly EIP712Field[]>} EIP712Types
 */
/**
 * Encode EIP-712 value according to type
 *
 * @param {string} type - Field type
 * @param {any} value - Field value
 * @param {EIP712Types} types - Type definitions
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded value (32 bytes)
 * @throws {InvalidEIP712ValueError} If value encoding fails
 * @throws {InvalidDomainTypeError} If type is not found
 */
export function encodeValue(type: string, value: any, types: EIP712Types, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
/**
 * Encode string or dynamic bytes value
 *
 * @param {string} type - Field type (string or bytes)
 * @param {any} value - Field value
 * @param {object} crypto - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} crypto.keccak256 - Keccak256 hash function
 * @returns {Uint8Array} Encoded value (32 bytes)
 * @throws {InvalidEIP712ValueError} If type is not string or bytes
 */
export function encodeStringOrBytes(type: string, value: any, crypto: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): Uint8Array;
export type EIP712Field = {
    readonly name: string;
    readonly type: string;
};
export type EIP712Types = Record<string, readonly EIP712Field[]>;
//# sourceMappingURL=encodeValue.d.ts.map