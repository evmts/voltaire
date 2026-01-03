import type { EtherType as BrandedEther } from "./EtherType.js";
import type { WeiType as BrandedWei } from "./WeiType.js";

const DECIMALS = 18;

/**
 * Convert Wei to Ether
 *
 * Converts bigint wei to decimal string ether value.
 * Uses pure string manipulation (no floating point) to preserve full precision
 * for arbitrarily large values up to max U256.
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param wei - Amount in Wei (bigint)
 * @returns Amount in Ether (string with decimal precision, 18 decimals max)
 * @throws {never}
 * @example
 * ```typescript
 * const ether1 = Wei.toEther(Wei.from(1000000000000000000n)); // "1"
 * const ether2 = Wei.toEther(Wei.from(1500000000000000000n)); // "1.5"
 * const ether3 = Wei.toEther(Wei.from(1000000000000000n));    // "0.001"
 * const ether4 = Wei.toEther(Wei.from(1n));                   // "0.000000000000000001"
 * ```
 */
export function toEther(wei: BrandedWei): BrandedEther {
	const weiStr = wei.toString().padStart(DECIMALS + 1, "0");

	const intPart = weiStr.slice(0, -DECIMALS) || "0";
	const decPart = weiStr.slice(-DECIMALS);

	// Remove trailing zeros from decimal part
	const trimmedDec = decPart.replace(/0+$/, "");

	if (trimmedDec === "") {
		return intPart as BrandedEther;
	}

	return `${intPart}.${trimmedDec}` as BrandedEther;
}
