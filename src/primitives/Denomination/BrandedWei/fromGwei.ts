import * as Uint from "../../Uint/index.js";
import type { BrandedGwei } from "../BrandedGwei/BrandedGwei.js";
import type { BrandedWei } from "./BrandedWei.js";
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
 * const wei = Wei.fromGwei(gwei);
 * // wei = 5000000000n
 * ```
 */
export function fromGwei(gwei: BrandedGwei): BrandedWei {
	const wei = Uint.times(gwei, Uint.from(WEI_PER_GWEI));
	return wei as BrandedWei;
}
