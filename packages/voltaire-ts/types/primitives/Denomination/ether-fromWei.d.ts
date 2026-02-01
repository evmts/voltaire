import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
/**
 * Convert Wei to Ether
 *
 * Converts bigint wei to decimal string ether value.
 * Alias for Wei.toEther().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Ether (string with decimal precision)
 * @throws {never}
 * @example
 * ```typescript
 * const ether1 = Ether.fromWei(Wei.from(1000000000000000000n)); // "1"
 * const ether2 = Ether.fromWei(Wei.from(1500000000000000000n)); // "1.5"
 * ```
 */
export declare function fromWei(wei: BrandedWei): BrandedEther;
//# sourceMappingURL=ether-fromWei.d.ts.map