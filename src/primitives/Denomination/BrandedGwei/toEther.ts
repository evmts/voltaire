import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import type { BrandedGwei } from "./BrandedGwei.js";
import { GWEI_PER_ETHER } from "./constants.js";

/**
 * Convert Gwei to Ether
 *
 * @param gwei - Amount in Gwei
 * @returns Amount in Ether (gwei / 10^9)
 *
 * @example
 * ```typescript
 * const gwei = Gwei.from(1000000000);
 * const ether = Gwei.toEther(gwei);
 * // ether = 1n
 * ```
 */
export function toEther(gwei: BrandedGwei): BrandedEther {
	const ether = gwei / GWEI_PER_ETHER;
	return ether as BrandedEther;
}
