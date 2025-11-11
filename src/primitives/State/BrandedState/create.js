/**
 * Create a new StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('../../Address/index.js').BrandedAddress} address - Contract address
 * @param {bigint} slot - Storage slot number
 * @returns {import('./BrandedStorageKey.js').BrandedStorageKey} A new StorageKey
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const contractAddr = Address.fromHex('0x...');
 * const key = State.create(contractAddr, 0n);
 * ```
 */
export function create(address, slot) {
	return { address, slot };
}
