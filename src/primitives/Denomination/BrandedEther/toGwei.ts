import type { BrandedGwei } from "../BrandedGwei/BrandedGwei.js";
import type { BrandedEther } from "./BrandedEther.js";
import { GWEI_PER_ETHER } from "./constants.js";

/**
 * Convert Ether to Gwei
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether
 * @returns Amount in Gwei (ether * 10^9)
 * @throws {never}
 * @example
 * ```typescript
 * const ether = Ether.from(1n);
 * const gwei = Ether.toGwei(ether);
 * // gwei = 1000000000n
 * ```
 */
export function toGwei(ether: BrandedEther): BrandedGwei {
	const gwei = ether * GWEI_PER_ETHER;
	return gwei as BrandedGwei;
}
