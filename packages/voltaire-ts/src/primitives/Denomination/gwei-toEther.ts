import type { EtherType as BrandedEther } from "./EtherType.js";
import type { GweiType as BrandedGwei } from "./GweiType.js";

const SHIFT = 9; // Gwei to Ether: shift decimal 9 places left

/**
 * Convert Gwei to Ether
 *
 * Converts gwei string to ether string (divides by 10^9).
 *
 * @see https://voltaire.tevm.sh/primitives/denomination for Denomination documentation
 * @since 0.0.0
 * @param gwei - Amount in Gwei (string)
 * @returns Amount in Ether (string)
 * @throws {never}
 * @example
 * ```typescript
 * const ether1 = Gwei.toEther(Gwei.from("1000000000")); // "1"
 * const ether2 = Gwei.toEther(Gwei.from("1500000000")); // "1.5"
 * const ether3 = Gwei.toEther(Gwei.from("1"));          // "0.000000001"
 * ```
 */
export function toEther(gwei: BrandedGwei): BrandedEther {
	const str = gwei.toString();
	const [intPart, decPart = ""] = str.split(".");

	// Combine int and dec, then shift decimal point left by SHIFT positions
	const combined = intPart + decPart;
	const totalDecimals = decPart.length + SHIFT;

	// Pad with leading zeros if needed
	const padded = combined.padStart(totalDecimals + 1, "0");

	const newIntPart = padded.slice(0, -totalDecimals) || "0";
	const newDecPart = padded.slice(-totalDecimals);

	// Remove trailing zeros from decimal part
	const trimmedDec = newDecPart.replace(/0+$/, "");

	if (trimmedDec === "") {
		return newIntPart as BrandedEther;
	}

	return `${newIntPart}.${trimmedDec}` as BrandedEther;
}
