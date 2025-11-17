import * as Uint from "../Uint/index.js";

/**
 * Convert GasLimit to number
 *
 * @param this - Gas limit
 * @returns Number
 * @throws If value exceeds safe integer range
 *
 * @example
 * ```typescript
 * const n = GasLimit._toNumber.call(limit);
 * ```
 */
export function gasLimitToNumber() {
	return Uint.toNumber(this);
}
