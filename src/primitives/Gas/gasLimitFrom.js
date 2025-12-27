import * as Uint from "../Uint/index.js";

/**
 * Create GasLimit from number, bigint, or hex string
 *
 * @param {bigint | number | string} value - Value to convert
 * @returns {import('./GasLimitType.js').GasLimitType} Gas limit
 *
 * @example
 * ```typescript
 * const limit1 = GasLimit.from(21000);
 * const limit2 = GasLimit.from(21000n);
 * const limit3 = GasLimit.from("0x5208");
 * ```
 */
export function gasLimitFrom(value) {
	return /** @type {import('./GasLimitType.js').GasLimitType} */ (
		/** @type {unknown} */ (Uint.from(value))
	);
}
