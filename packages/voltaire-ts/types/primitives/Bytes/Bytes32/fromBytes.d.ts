/**
 * Create Bytes32 from raw bytes
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./Bytes32Type.js').Bytes32Type} Bytes32
 * @throws {InvalidLengthError} If bytes is wrong length
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const bytes = Bytes32.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes: Uint8Array): import("./Bytes32Type.js").Bytes32Type;
//# sourceMappingURL=fromBytes.d.ts.map