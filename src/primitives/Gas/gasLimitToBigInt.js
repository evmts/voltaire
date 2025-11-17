import * as Uint from "../Uint/index.js";

/**
 * Convert GasLimit to bigint
 *
 * @param this - Gas limit
 * @returns BigInt
 *
 * @example
 * ```typescript
 * const n = GasLimit._toBigInt.call(limit);
 * ```
 */
export function gasLimitToBigInt() {
	return Uint.toBigInt(this);
}
