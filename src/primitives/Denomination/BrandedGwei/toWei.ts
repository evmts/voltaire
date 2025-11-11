import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import type { BrandedGwei } from "./BrandedGwei.js";
import { WEI_PER_GWEI } from "./constants.js";

/**
 * Convert Gwei to Wei
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei
 * @returns Amount in Wei (gwei * 10^9)
 * @throws {never}
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
