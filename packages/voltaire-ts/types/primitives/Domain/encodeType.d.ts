/**
 * @typedef {{ readonly name: string; readonly type: string }} EIP712Field
 * @typedef {Record<string, readonly EIP712Field[]>} EIP712Types
 */
/**
 * Encode EIP-712 type definition
 *
 * Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
 *
 * @param {string} primaryType - Primary type name
 * @param {EIP712Types} types - Type definitions
 * @returns {string} Encoded type string
 */
export function encodeType(primaryType: string, types: EIP712Types): string;
export type EIP712Field = {
    readonly name: string;
    readonly type: string;
};
export type EIP712Types = Record<string, readonly EIP712Field[]>;
//# sourceMappingURL=encodeType.d.ts.map