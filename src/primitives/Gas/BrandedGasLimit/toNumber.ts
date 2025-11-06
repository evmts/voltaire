import * as Uint from "../../Uint/index.js";
import type { BrandedGasLimit } from "./BrandedGasLimit.js";

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
export function toNumber(this: BrandedGasLimit): number {
	return Uint.toNumber(this);
}
