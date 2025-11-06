import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import type { BrandedEther } from "./BrandedEther.js";
import { WEI_PER_ETHER } from "./constants.js";

/**
 * Convert Wei to Ether
 *
 * @param wei - Amount in Wei
 * @returns Amount in Ether (wei / 10^18)
 *
 * @example
 * ```typescript
 * const wei = Wei.from(1000000000000000000n);
 * const ether = Ether.fromWei(wei);
 * // ether = 1n
 * ```
 */
export function fromWei(wei: BrandedWei): BrandedEther {
	const ether = wei / WEI_PER_ETHER;
	return ether as BrandedEther;
}
