import * as Uint from "../Uint/index.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { WEI_PER_GWEI } from "./wei-constants.js";

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
	const wei = Uint.times(gwei as unknown as Uint.Type, Uint.from(WEI_PER_GWEI));
	return wei as unknown as BrandedWei;
}
