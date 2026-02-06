/**
 * Convert Bytes32 to Hash (same size, different semantic meaning)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.js').Bytes32Type} bytes - Bytes32 to convert
 * @returns {import('../../Hash/HashType.js').HashType} Hash
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const hash = Bytes32.toHash(bytes);
 * ```
 */
export function toHash(bytes: import("./Bytes32Type.js").Bytes32Type): import("../../Hash/HashType.js").HashType;
//# sourceMappingURL=toHash.d.ts.map