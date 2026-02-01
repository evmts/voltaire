import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
/**
 * Convert Wei to Ether
 *
 * Converts bigint wei to decimal string ether value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Ether (string with decimal precision)
 * @throws {never}
 * @example
 * ```typescript
 * const ether1 = Wei.toEther(Wei.from(1000000000000000000n)); // "1"
 * const ether2 = Wei.toEther(Wei.from(1500000000000000000n)); // "1.5"
 * const ether3 = Wei.toEther(Wei.from(1000000000000000n));    // "0.001"
 * ```
 */
export declare function toEther(wei: BrandedWei): BrandedEther;
//# sourceMappingURL=wei-toEther.d.ts.map