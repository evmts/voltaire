/** Maximum value for a 256-bit storage slot (2^256 - 1) */
const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Convert StorageKeyLike to StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {import('./StorageKeyType.js').StorageKeyLike} value - Value to convert
 * @returns {import('./StorageKeyType.js').StorageKeyType} StorageKey
 * @throws {RangeError} If slot is negative or exceeds 256 bits
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = State.from({ address: addr, slot: 0n });
 * ```
 */
export function from(value) {
	if (value.slot < 0n || value.slot > MAX_UINT256) {
		throw new RangeError(
			"Storage slot must be a non-negative value that fits in bytes32 (0 to 2^256-1)",
		);
	}
	return { address: value.address, slot: value.slot };
}
