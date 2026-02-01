/**
 * Create Bytes64 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 64 bytes)
 * @returns {import('./Bytes64Type.js').Bytes64Type} Bytes64
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const bytes = Bytes64.fromBytes(new Uint8Array(64));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Bytes64Type.js").Bytes64Type;
//# sourceMappingURL=fromBytes.d.ts.map