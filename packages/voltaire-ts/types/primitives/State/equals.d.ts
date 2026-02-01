/**
 * Check equality between two storage keys.
 *
 * Two storage keys are equal if and only if both their address and
 * slot number match exactly.
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./StorageKeyType.js').StorageKeyLike} a - First storage key
 * @param {import('./StorageKeyType.js').StorageKeyLike} b - Second storage key
 * @returns {boolean} True if both address and slot match
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key1 = { address: addr, slot: 0n };
 * const key2 = { address: addr, slot: 0n };
 * State.equals(key1, key2); // true
 * ```
 */
export function equals(a: import("./StorageKeyType.js").StorageKeyLike, b: import("./StorageKeyType.js").StorageKeyLike): boolean;
//# sourceMappingURL=equals.d.ts.map