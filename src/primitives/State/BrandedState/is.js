/**
 * Type guard to check if a value is a valid StorageKey
 *
 * @see https://voltaire.tevm.sh/primitives/state for State documentation
 * @since 0.0.0
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedStorageKey.js').BrandedStorageKey} True if value is a valid StorageKey
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
	return (
		"address" in value &&
		value.address instanceof Uint8Array &&
		value.address.length === 20 &&
		"slot" in value &&
		typeof value.slot === "bigint"
	);
}
