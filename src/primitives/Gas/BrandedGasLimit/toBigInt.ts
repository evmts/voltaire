import * as Uint from "../../Uint/index.js";
import type { BrandedGasLimit } from "./BrandedGasLimit.js";

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
export function toBigInt(this: BrandedGasLimit): bigint {
	return Uint.toBigInt(this);
}
