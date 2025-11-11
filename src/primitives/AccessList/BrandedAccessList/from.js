import { fromBytes } from "./fromBytes.js";

/**
 * Create AccessList from array or bytes (EIP-2930)
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {readonly import('../BrandedAccessList.js').Item[] | Uint8Array} value - AccessList items or RLP bytes
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} AccessList
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.from([{ address: '0x742d35Cc...', storageKeys: [] }]);
 * const list2 = AccessList.from(bytes); // from RLP bytes
 * ```
 */
export function from(value) {
	if (value instanceof Uint8Array) {
		return fromBytes(value);
	}
	return value;
}
