/**
 * Assert value is a Hash, throws if not
 *
 * @see https://voltaire.tevm.sh/primitives/hash for Hash documentation
 * @since 0.0.0
 * @param {unknown} value - Value to assert
 * @param {string} [message] - Optional error message
 * @returns {asserts value is import('./HashType.js').HashType}
 * @throws {InvalidFormatError} If value is not a Hash
 * @example
 * ```javascript
 * import * as Hash from './primitives/Hash/index.js';
 * Hash.assert(value); // throws if not Hash
 * ```
 */
export function assert(value: unknown, message?: string): asserts value is import("./HashType.js").HashType;
//# sourceMappingURL=assert.d.ts.map