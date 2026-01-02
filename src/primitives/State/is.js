/** Maximum value for a 256-bit storage slot (2^256 - 1) */
const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Type guard to check if a value is a valid StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./StorageKeyType.js').StorageKeyType} True if value is a valid StorageKey
 * @throws {never}
 * @example
 * ```javascript
 * import * as State from './primitives/State/index.js';
 * const key = { address: addr, slot: 0n };
 * if (State.is(key)) {
 *   // key is StorageKey
 * }
 * ```
 */
export function is(value) {
	if (typeof value !== "object" || value === null) return false;
	if (
		!("address" in value) ||
		!(value.address instanceof Uint8Array) ||
		value.address.length !== 20
	)
		return false;
	if (!("slot" in value) || typeof value.slot !== "bigint") return false;
	// Validate slot fits in bytes32 (256 bits)
	if (value.slot < 0n || value.slot > MAX_UINT256) return false;
	return true;
}
