import * as Uint from "../../Uint/index.js";
import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import type { BrandedWei } from "./BrandedWei.js";
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
 * const ether = Ether.from(1);
 * const wei = Wei.fromEther(ether);
 * // wei = 1000000000000000000n
 * ```
 */
export function fromEther(ether: BrandedEther): BrandedWei {
	const wei = Uint.times(ether, Uint.from(WEI_PER_ETHER));
	return wei as BrandedWei;
}
