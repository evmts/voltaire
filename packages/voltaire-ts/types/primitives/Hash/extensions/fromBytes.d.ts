/**
 * Create Hash from Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 32-byte array
 * @returns {import('./../BrandedHash.js').BrandedHash} Hash bytes
 * @throws {InvalidLengthError} If bytes is not 32 bytes
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./../BrandedHash.js").BrandedHash;
//# sourceMappingURL=fromBytes.d.ts.map