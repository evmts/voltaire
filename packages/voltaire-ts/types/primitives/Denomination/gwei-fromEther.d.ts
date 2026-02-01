import type { EtherType as BrandedEther } from "./EtherType.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";
/**
 * Convert Ether to Gwei
 *
 * Converts ether string to gwei string (multiplies by 10^9).
 * Alias for Ether.toGwei().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string)
 * @returns Amount in Gwei (string)
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Gwei.fromEther(Ether.from("1"));   // "1000000000"
 * const gwei2 = Gwei.fromEther(Ether.from("1.5")); // "1500000000"
 * ```
 */
export declare function fromEther(ether: BrandedEther): BrandedGwei;
//# sourceMappingURL=gwei-fromEther.d.ts.map