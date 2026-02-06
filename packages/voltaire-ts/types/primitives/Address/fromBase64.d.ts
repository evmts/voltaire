/**
 * Create Address from base64 string
 *
 * @param {string} b64 - Base64 encoded string
 * @returns {import('./AddressType.js').AddressType} Address
 * @throws {import('./errors.js').InvalidAddressLengthError} If decoded length is not 20 bytes
 *
 * @example
 * ```typescript
 * const addr = Address.fromBase64("dC01zGY0wFMpJaO4RLyedZXyUeM=");
 * ```
 */
export function fromBase64(b64: string): import("./AddressType.js").AddressType;
//# sourceMappingURL=fromBase64.d.ts.map