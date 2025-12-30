import type { GweiType as BrandedGwei } from "./GweiType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { toGwei } from "./wei-toGwei.js";

/**
 * Convert Wei to Gwei
 *
 * Converts bigint wei to decimal string gwei value.
 * Alias for Wei.toGwei().
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Gwei (string with decimal precision)
 * @throws {never}
 * @example
 * ```typescript
 * const gwei1 = Gwei.fromWei(Wei.from(5000000000n)); // "5"
 * const gwei2 = Gwei.fromWei(Wei.from(1500000000n)); // "1.5"
 * ```
 */
export function fromWei(wei: BrandedWei): BrandedGwei {
	return toGwei(wei);
}
