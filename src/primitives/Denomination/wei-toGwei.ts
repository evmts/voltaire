import * as Uint from "../Uint/index.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { WEI_PER_GWEI } from "./gwei-constants.js";

/**
 * Convert Wei to Gwei
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei
 * @returns Amount in Gwei (wei / 10^9, truncated)
 * @throws {never}
 * @example
 * ```typescript
 * const wei = Wei.from(5000000000n);
 * const gwei = Wei.toGwei(wei);
 * // gwei = 5n
 * ```
 */
export function toGwei(wei: BrandedWei): BrandedGwei {
	const gwei = Uint.dividedBy(wei as unknown as Uint.Type, Uint.from(WEI_PER_GWEI));
	return gwei as unknown as BrandedGwei;
}
