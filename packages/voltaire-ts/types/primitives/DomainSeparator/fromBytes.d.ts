/**
 * Create DomainSeparator from bytes
 *
 * @param {Uint8Array} bytes - 32-byte array
 * @returns {import('./DomainSeparatorType.js').DomainSeparatorType} DomainSeparator
 * @throws {InvalidDomainSeparatorLengthError} If bytes length is not 32
 * @example
 * ```javascript
 * const sep = DomainSeparator.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./DomainSeparatorType.js").DomainSeparatorType;
//# sourceMappingURL=fromBytes.d.ts.map