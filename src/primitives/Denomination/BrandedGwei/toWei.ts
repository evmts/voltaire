import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import type { BrandedGwei } from "./BrandedGwei.js";
import { WEI_PER_GWEI } from "./constants.js";

/**
 * Convert Gwei to Wei
 *
 * @param gwei - Amount in Gwei
 * @returns Amount in Wei (gwei * 10^9)
 *
 * @example
 * ```typescript
 * const gwei = Gwei.from(5);
 * const wei = Gwei.toWei(gwei);
 * // wei = 5000000000n
 * ```
 */
export function toWei(gwei: BrandedGwei): BrandedWei {
	const wei = gwei * WEI_PER_GWEI;
	return wei as BrandedWei;
}
