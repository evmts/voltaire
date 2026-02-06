/**
 * Convert StorageKey to a string representation for use as Map key
 *
 * The string format is: address_hex + "_" + slot_hex
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./StorageKeyType.js').StorageKeyLike} key - Storage key to convert
 * @returns {string} String representation (address_hex + "_" + slot_hex)
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = { address: addr, slot: 42n };
 * const str = State.toString(key);
 * // Use as Map key
 * map.set(str, value);
 * ```
 */
export function toString(key: import("./StorageKeyType.js").StorageKeyLike): string;
//# sourceMappingURL=toString.d.ts.map