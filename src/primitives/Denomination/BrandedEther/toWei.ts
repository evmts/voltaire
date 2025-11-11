import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import type { BrandedEther } from "./BrandedEther.js";
import { WEI_PER_ETHER } from "./constants.js";

/**
 * Convert Ether to Wei
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether
 * @returns Amount in Wei (ether * 10^18)
 * @throws {never}
 * @example
 * ```typescript
 * const ether = Ether.from(1n);
 * const wei = Ether.toWei(ether);
 * // wei = 1000000000000000000n
 * ```
 */
export function toWei(ether: BrandedEther): BrandedWei {
	const wei = ether * WEI_PER_ETHER;
	return wei as BrandedWei;
}
