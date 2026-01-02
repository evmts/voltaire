/** Maximum value for a 256-bit storage slot (2^256 - 1) */
const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Create a new StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('../Address/index.js').AddressType} address - Contract address
 * @param {bigint} slot - Storage slot number (must fit in bytes32)
 * @returns {import('./StorageKeyType.js').StorageKeyType} A new StorageKey
 * @throws {RangeError} If slot is negative or exceeds 256 bits
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * import * as Address from './primitives/Address/index.js';
 * const contractAddr = Address.fromHex('0x...');
 * const key = State.create(contractAddr, 0n);
 * ```
 */
export function create(address, slot) {
	if (slot < 0n || slot > MAX_UINT256) {
		throw new RangeError(
			"Storage slot must be a non-negative value that fits in bytes32 (0 to 2^256-1)",
		);
	}
	return { address, slot };
}
