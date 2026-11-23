import type { Uint256Type } from "../Uint/Uint256Type.js";
import type { EtherType as BrandedEther } from "./EtherType.js";
import { toWei } from "./ether-toWei.js";

const MAX_UINT256 = (1n << 256n) - 1n;

/**
 * Convert Ether to Uint256 (in Wei)
 *
 * Converts ether string to wei bigint, then returns as Uint256.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param ether - Amount in Ether (string)
 * @returns Uint256 value in Wei
 * @throws {Error} If ether value has more than 18 decimal places, is negative, or exceeds the Uint256 maximum
 * @example
 * ```typescript
 * const u256_1 = Ether.toU256(Ether.from("1"));   // 1000000000000000000n
 * const u256_2 = Ether.toU256(Ether.from("1.5")); // 1500000000000000000n
 * ```
 */
export function toU256(ether: BrandedEther): Uint256Type {
	const wei = toWei(ether);
	if (wei < 0n) {
		throw new Error(`Ether value cannot be negative as Uint256: ${ether}`);
	}
	if (wei > MAX_UINT256) {
		throw new Error(`Ether value exceeds Uint256 maximum: ${ether}`);
	}
	return wei as unknown as Uint256Type;
}
