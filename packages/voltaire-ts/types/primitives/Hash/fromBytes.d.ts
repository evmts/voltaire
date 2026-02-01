/**
 * Create Hash from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./HashType.js').HashType} Hash bytes
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./HashType.js").HashType;
//# sourceMappingURL=fromBytes.d.ts.map