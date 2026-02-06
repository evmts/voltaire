import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";
/**
 * Convert Gwei to Uint256 (in Wei)
 *
 * Converts gwei string to wei bigint, then returns as Uint256.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei (string)
 * @returns Uint256 value in Wei
 * @throws {Error} If gwei value has more than 9 decimal places
 * @example
 * ```typescript
 * const u256_1 = Gwei.toU256(Gwei.from("5"));   // 5000000000n
 * const u256_2 = Gwei.toU256(Gwei.from("1.5")); // 1500000000n
 * ```
 */
export declare function toU256(gwei: BrandedGwei): Uint256Type;
//# sourceMappingURL=gwei-toU256.d.ts.map