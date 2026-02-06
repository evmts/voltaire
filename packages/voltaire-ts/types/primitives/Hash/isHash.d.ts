/**
 * Check if value is a valid Hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./HashType.js').HashType} True if value is Hash type
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * if (Hash.isHash(value)) {
 *   // value is Hash
 * }
 * ```
 */
export function isHash(value: unknown): value is import("./HashType.js").HashType;
//# sourceMappingURL=isHash.d.ts.map