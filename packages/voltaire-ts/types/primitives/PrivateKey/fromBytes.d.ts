/**
 * Create PrivateKey from raw bytes
 *
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./PrivateKeyType.js').PrivateKeyType} Private key
 * @throws {InvalidLengthError} If bytes is not 32 bytes
 * @throws {InvalidRangeError} If private key is out of range [1, n-1]
 *
 * @example
 * ```javascript
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const bytes = new Uint8Array(32);
 * const privateKey = PrivateKey.fromBytes(bytes);
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./PrivateKeyType.js").PrivateKeyType;
//# sourceMappingURL=fromBytes.d.ts.map