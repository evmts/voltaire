import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import type { BrandedGwei } from "./BrandedGwei.js";
import { GWEI_PER_ETHER } from "./constants.js";

/**
 * Convert Ether to Gwei
 *
 * @param ether - Amount in Ether
 * @returns Amount in Gwei (ether * 10^9)
 *
 * @example
 * ```typescript
 * const ether = Ether.from(1);
 * const gwei = Gwei.fromEther(ether);
 * // gwei = 1000000000n
 * ```
 */
export function fromEther(ether: BrandedEther): BrandedGwei {
	const gwei = ether * GWEI_PER_ETHER;
	return gwei as BrandedGwei;
}
