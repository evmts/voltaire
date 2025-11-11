import { from } from "./from.js";

/**
 * Check equality between two storage keys.
 *
 * Two storage keys are equal if and only if both their address and
 * slot number match exactly.
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} a - First storage key
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} b - Second storage key
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
export function equals(a, b) {
	const keyA = from(a);
	const keyB = from(b);

	if (keyA.slot !== keyB.slot) return false;
	if (keyA.address.length !== keyB.address.length) return false;
	for (let i = 0; i < keyA.address.length; i++) {
		if ((keyA.address[i] ?? 0) !== (keyB.address[i] ?? 0)) return false;
	}
	return true;
}
