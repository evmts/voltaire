/**
 * @typedef {import('./StorageValueType.js').StorageValueType} StorageValueType
 */

/**
 * Converts a StorageValue to a bigint (Uint256).
 *
 * @param {StorageValueType} value - The StorageValue to convert
 * @returns {bigint} - The numeric value as bigint
 *
 * @example
 * ```typescript
 * const val = StorageValue.from(123n);
 * const num = StorageValue.toUint256(val);
 * // 123n
 * ```
 */
export function toUint256(value) {
	let result = 0n;
	for (let i = 0; i < value.length; i++) {
		result = (result << 8n) | BigInt(/** @type {number} */ (value[i]));
	}
	return result;
}
