import type { BrandedWei } from "../BrandedWei/BrandedWei.js";
import type { BrandedGwei } from "./BrandedGwei.js";
import { WEI_PER_GWEI } from "./constants.js";

/**
 * Convert Wei to Gwei
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei
 * @returns Amount in Gwei (wei / 10^9)
 * @throws {never}
 * @example
 * ```typescript
 * const wei = Wei.from(5000000000);
 * const gwei = Gwei.fromWei(wei);
 * // gwei = 5n
 * ```
 */
export function fromWei(wei: BrandedWei): BrandedGwei {
	const gwei = wei / WEI_PER_GWEI;
	return gwei as BrandedGwei;
}
