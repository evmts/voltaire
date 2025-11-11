import * as Uint from "../../Uint/index.js";
import type { BrandedEther } from "../BrandedEther/BrandedEther.js";
import type { BrandedWei } from "./BrandedWei.js";
import { WEI_PER_ETHER } from "./constants.js";

/**
 * Convert Wei to Ether
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei
 * @returns Amount in Ether (wei / 10^18, truncated)
 * @throws {never}
 * @example
 * ```typescript
 * const wei = Wei.from(1000000000000000000n);
 * const ether = Wei.toEther(wei);
 * // ether = 1n
 * ```
 */
export function toEther(wei: BrandedWei): BrandedEther {
	const ether = Uint.dividedBy(wei, Uint.from(WEI_PER_ETHER));
	return ether as BrandedEther;
}
