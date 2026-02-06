/**
 * Encode type string for EIP-712 hashing.
 *
 * Produces type encoding like "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {string} primaryType - Primary type name to encode
 * @param {import('./EIP712Type.js').TypeDefinitions} types - Type definitions mapping
 * @returns {string} Encoded type string with primary type followed by referenced types in alphabetical order
 * @throws {Eip712TypeNotFoundError} If primaryType or any referenced type is not found
 * @example
 * ```javascript
 * import * as EIP712 from './crypto/EIP712/index.js';
 * const types = { Mail: [{ name: 'from', type: 'Person' }], Person: [{ name: 'name', type: 'string' }] };
 * const typeString = EIP712.encodeType('Mail', types);
 * // Returns: "Mail(Person from)Person(string name)"
 * ```
 */
export function encodeType(primaryType: string, types: import("./EIP712Type.js").TypeDefinitions): string;
//# sourceMappingURL=encodeType.d.ts.map