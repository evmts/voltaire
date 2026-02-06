/**
 * Convert Epoch to bigint
 *
 * @see https://voltaire.tevm.sh/primitives/epoch for Epoch documentation
 * @since 0.0.0
 * @param {import('./EpochType.js').EpochType} epoch - Epoch value
 * @returns {bigint} BigInt representation
 * @throws {never}
 * @example
 * ```javascript
 * import * as Epoch from './primitives/Epoch/index.js';
 * const epoch = Epoch.from(100000);
 * const big = Epoch.toBigInt(epoch); // 100000n
 * ```
 */
export function toBigInt(epoch) {
	return BigInt(epoch);
}
