import type { BrandedGwei } from "../BrandedGwei/BrandedGwei.js";
import type { BrandedEther } from "./BrandedEther.js";
import { GWEI_PER_ETHER } from "./constants.js";

/**
 * Convert Gwei to Ether
 *
 * @param gwei - Amount in Gwei
 * @returns Amount in Ether (gwei / 10^9)
 *
 * @example
 * ```typescript
 * const gwei = Gwei.from(1000000000n);
 * const ether = Ether.fromGwei(gwei);
 * // ether = 1n
 * ```
 */
export function fromGwei(gwei: BrandedGwei): BrandedEther {
	const ether = gwei / GWEI_PER_ETHER;
	return ether as BrandedEther;
}
