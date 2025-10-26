// Test data: various trailing zero patterns
const empty = "0x";
const noTrailingZeros = "0xabcd";
const trailingZeros = "0xabcd000000";
const allZeros = "0x000000";
const thirtyTwo =
	"0x0100000000000000000000000000000000000000000000000000000000000000";

// Manual trimRight implementation (ethers doesn't have a built-in)
function trimRight(value: string): string {
	if (!value.startsWith("0x")) {
		throw new Error("Value must be a hex string");
	}
	const hex = value.slice(2);
	if (hex.length === 0) {
		return "0x";
	}
	// Remove trailing zeros but keep at least one character
	const trimmed = hex.replace(/0+$/, "");
	return `0x${trimmed.length === 0 ? "0" : trimmed}`;
}

export function main(): void {
	// Trim empty (edge case)
	trimRight(empty);

	// Trim value with no trailing zeros
	trimRight(noTrailingZeros);

	// Trim value with trailing zeros
	trimRight(trailingZeros);

	// Trim all zeros
	trimRight(allZeros);

	// Trim 32-byte value with trailing zeros
	trimRight(thirtyTwo);
}
