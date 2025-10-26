import { trim } from "viem";

// Test data: various leading zero patterns
const empty = "0x";
const noLeadingZeros = "0xabcd";
const leadingZeros = "0x000000abcd";
const allZeros = "0x000000";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";

export function main(): void {
	// Trim empty (edge case)
	trim(empty);

	// Trim value with no leading zeros
	trim(noLeadingZeros);

	// Trim value with leading zeros
	trim(leadingZeros);

	// Trim all zeros
	trim(allZeros);

	// Trim 32-byte value with leading zeros
	trim(thirtyTwo);
}
