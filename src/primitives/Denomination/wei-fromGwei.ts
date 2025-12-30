import type { GweiType as BrandedGwei } from "./GweiType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { toWei } from "./gwei-toWei.js";

/**
 * Convert Gwei to Wei
 *
 * Parses decimal gwei string and converts to bigint wei value.
 * Alias for Gwei.toWei().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei (string, supports decimals like "1.5")
 * @returns Amount in Wei (bigint)
 * @throws {Error} If gwei value has more than 9 decimal places
 * @example
 * ```typescript
 * const wei1 = Wei.fromGwei(Gwei.from("5"));     // 5000000000n
 * const wei2 = Wei.fromGwei(Gwei.from("1.5"));   // 1500000000n
 * ```
 */
export function fromGwei(gwei: BrandedGwei): BrandedWei {
	return toWei(gwei);
}
