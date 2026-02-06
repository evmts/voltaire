/**
 * Compute a hash code for the storage key for use in hash-based collections
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./StorageKeyType.js').StorageKeyLike} key - Storage key to hash
 * @returns {number} Hash code as a number
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const hash = State.hashCode(key);
 * ```
 */
export function hashCode(key: import("./StorageKeyType.js").StorageKeyLike): number;
//# sourceMappingURL=hashCode.d.ts.map