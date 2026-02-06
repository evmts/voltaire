import type { GweiType as BrandedGwei } from "./GweiType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
/**
 * Convert Wei to Gwei
 *
 * Converts bigint wei to decimal string gwei value.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Gwei (string with decimal precision)
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Wei.toGwei(Wei.from(5000000000n)); // "5"
 * const gwei2 = Wei.toGwei(Wei.from(1500000000n)); // "1.5"
 * const gwei3 = Wei.toGwei(Wei.from(1000000n));    // "0.001"
 * ```
 */
export declare function toGwei(wei: BrandedWei): BrandedGwei;
//# sourceMappingURL=wei-toGwei.d.ts.map