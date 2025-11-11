import type { BrandedUint } from "../../Uint/BrandedUint/BrandedUint.js";
import type { BrandedEther } from "./BrandedEther.js";

/**
 * Convert Ether to base Uint256 type
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether
 * @returns Uint256 value (type cast, no conversion)
 * @throws {never}
 * @example
 * ```typescript
 * const ether = Ether.from(1n);
 * const u256 = Ether.toU256(ether);
 * // u256 = 1n (as Uint256)
 * ```
 */
export function toU256(ether: BrandedEther): BrandedUint {
	return ether as BrandedUint;
}
