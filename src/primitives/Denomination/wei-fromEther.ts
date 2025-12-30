import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { toWei } from "./ether-toWei.js";

/**
 * Convert Ether to Wei
 *
 * Parses decimal ether string and converts to bigint wei value.
 * Alias for Ether.toWei().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string, supports decimals like "1.5")
 * @returns Amount in Wei (bigint)
 * @throws {Error} If ether value has more than 18 decimal places
 * @example
 * ```typescript
 * const wei1 = Wei.fromEther(Ether.from("1"));     // 1000000000000000000n
 * const wei2 = Wei.fromEther(Ether.from("1.5"));   // 1500000000000000000n
 * ```
 */
export function fromEther(ether: BrandedEther): BrandedWei {
	return toWei(ether);
}
