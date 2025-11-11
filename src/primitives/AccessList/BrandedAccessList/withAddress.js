import { includesAddress } from "./includesAddress.js";

/**
 * Add address to access list (EIP-2930)
 *
 * Creates new entry if address doesn't exist, otherwise returns original list.
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to add to
 * @param {import('../../Address/BrandedAddress/BrandedAddress.js').BrandedAddress} address - Address to add
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} New access list with address added
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.create();
 * const newList = AccessList.withAddress(list, address);
 * ```
 */
export function withAddress(list, address) {
	if (includesAddress(list, address)) {
		return list;
	}
	return [...list, { address, storageKeys: [] }];
}
