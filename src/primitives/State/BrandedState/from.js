/**
 * Convert StorageKeyLike to StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} value - Value to convert
 * @returns {import('./BrandedStorageKey.js').BrandedStorageKey} StorageKey
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = State.from({ address: addr, slot: 0n });
 * ```
 */
export function from(value) {
	return { address: value.address, slot: value.slot };
}
