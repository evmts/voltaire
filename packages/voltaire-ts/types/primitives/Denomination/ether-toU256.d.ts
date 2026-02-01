import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { EtherType as BrandedEther } from "./EtherType.js";
/**
 * Convert Ether to Uint256 (in Wei)
 *
 * Converts ether string to wei bigint, then returns as Uint256.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string)
 * @returns Uint256 value in Wei
 * @throws {Error} If ether value has more than 18 decimal places
 * @example
 * ```typescript
 * const u256_1 = Ether.toU256(Ether.from("1"));   // 1000000000000000000n
 * const u256_2 = Ether.toU256(Ether.from("1.5")); // 1500000000000000000n
 * ```
 */
export declare function toU256(ether: BrandedEther): Uint256Type;
//# sourceMappingURL=ether-toU256.d.ts.map