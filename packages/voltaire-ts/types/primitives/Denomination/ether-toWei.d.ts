import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
/**
 * Convert Ether to Wei
 *
 * Parses decimal string and converts to bigint wei value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string, supports decimals like "1.5")
 * @returns Amount in Wei (bigint)
 * @throws {Error} If ether value has more than 18 decimal places
 * @example
 * ```typescript
 * const wei1 = Ether.toWei(Ether.from("1"));     // 1000000000000000000n
 * const wei2 = Ether.toWei(Ether.from("1.5"));   // 1500000000000000000n
 * const wei3 = Ether.toWei(Ether.from("0.001")); // 1000000000000000n
 * ```
 */
export declare function toWei(ether: BrandedEther): BrandedWei;
//# sourceMappingURL=ether-toWei.d.ts.map