import { trim } from "viem";

// Test data: various trailing zero patterns
const empty = "0x";
const noTrailingZeros = "0xabcd";
const trailingZeros = "0xabcd000000";
const allZeros = "0x000000";
const thirtyTwo =
	"0x0100000000000000000000000000000000000000000000000000000000000000";

export function main(): void {
	// Trim empty (edge case)
	trim(empty, { dir: "right" });

	// Trim value with no trailing zeros
	trim(noTrailingZeros, { dir: "right" });

	// Trim value with trailing zeros
	trim(trailingZeros, { dir: "right" });

	// Trim all zeros
	trim(allZeros, { dir: "right" });

	// Trim 32-byte value with trailing zeros
	trim(thirtyTwo, { dir: "right" });
}
