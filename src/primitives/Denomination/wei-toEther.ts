import * as Uint from "../Uint/index.js";
import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";
import { WEI_PER_ETHER } from "./ether-constants.js";

/**
 * Convert Wei to Ether
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei
 * @returns Amount in Ether (wei / 10^18, truncated)
 * @throws {never}
 * @example
 * ```typescript
 * const wei = Wei.from(1000000000000000000n);
 * const ether = Wei.toEther(wei);
 * // ether = 1n
 * ```
 */
export function toEther(wei: BrandedWei): BrandedEther {
	const ether = Uint.dividedBy(wei as unknown as Uint.Type, Uint.from(WEI_PER_ETHER));
	return ether as unknown as BrandedEther;
}
