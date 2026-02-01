/**
 * Generate random hash
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @returns {import('./HashType.js').HashType} Random 32-byte hash
 * @throws {ValidationError} If crypto.getRandomValues not available
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * const hash = Hash.random();
 * ```
 */
export function random(): import("./HashType.js").HashType;
//# sourceMappingURL=random.d.ts.map