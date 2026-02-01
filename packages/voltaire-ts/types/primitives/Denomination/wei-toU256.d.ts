import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
/**
 * Convert Wei to base Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei
 * @returns Uint256 value (type cast, no conversion)
 * @throws {never}
 * @example
 * ```typescript
 * const wei = Wei.from(1000000000n);
 * const u256 = Wei.toU256(wei);
 * // u256 = 1000000000n (as Uint256)
 * ```
 */
export declare function toU256(wei: BrandedWei): Uint256Type;
//# sourceMappingURL=wei-toU256.d.ts.map