/**
 * Create empty access list (EIP-2930)
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @returns {import('../BrandedAccessList.js').BrandedAccessList} Empty access list
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.create();
 * ```
 */
export function create() {
	return [];
}
