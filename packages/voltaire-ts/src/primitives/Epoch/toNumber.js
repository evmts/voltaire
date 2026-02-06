/**
 * Convert Epoch to number
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @since 0.0.0
 * @param {import('./EpochType.js').EpochType} epoch - Epoch value
 * @returns {number} Number representation
 * @throws {Error} If epoch exceeds safe integer range
 * @example
 * ```javascript
 * import * as Epoch from './primitives/Epoch/index.js';
 * const epoch = Epoch.from(100000n);
 * const num = Epoch.toNumber(epoch); // 100000
 * ```
 */
export function toNumber(epoch) {
	if (epoch > Number.MAX_SAFE_INTEGER) {
		throw new Error(`Epoch ${epoch} exceeds MAX_SAFE_INTEGER`);
	}
	return Number(epoch);
}
