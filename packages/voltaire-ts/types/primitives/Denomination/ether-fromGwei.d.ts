import type { EtherType as BrandedEther } from "./EtherType.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";
/**
 * Convert Gwei to Ether
 *
 * Converts gwei string to ether string (divides by 10^9).
 * Alias for Gwei.toEther().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei (string)
 * @returns Amount in Ether (string)
 * @throws {never}
 * @example
 * ```typescript
 * const ether1 = Ether.fromGwei(Gwei.from("1000000000")); // "1"
 * const ether2 = Ether.fromGwei(Gwei.from("1500000000")); // "1.5"
 * ```
 */
export declare function fromGwei(gwei: BrandedGwei): BrandedEther;
//# sourceMappingURL=ether-fromGwei.d.ts.map