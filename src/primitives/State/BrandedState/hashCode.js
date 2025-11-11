import { from } from "./from.js";

/**
 * Compute a hash code for the storage key for use in hash-based collections
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./BrandedStorageKey.js').StorageKeyLike} key - Storage key to hash
 * @returns {number} Hash code as a number
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const hash = State.hashCode(key);
 * ```
 */
export function hashCode(key) {
	const storageKey = from(key);
	let hash = 0;
	// Hash address bytes
	for (let i = 0; i < storageKey.address.length; i++) {
		hash = ((hash << 5) - hash + (storageKey.address[i] ?? 0)) | 0;
	}
	// Hash slot (convert to bytes)
	const slotLow = Number(storageKey.slot & 0xffffffffn);
	const slotHigh = Number((storageKey.slot >> 32n) & 0xffffffffn);
	hash = ((hash << 5) - hash + slotLow) | 0;
	hash = ((hash << 5) - hash + slotHigh) | 0;
	return hash;
}
