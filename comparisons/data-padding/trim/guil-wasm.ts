// Test data: various leading zero patterns
const empty = "0x";
const noLeadingZeros = "0xabcd";
const leadingZeros = "0x000000abcd";
const allZeros = "0x000000";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";

// Manual trim implementation (removes leading zeros)
function trimLeft(value: string): string {
	if (!value.startsWith("0x")) {
		throw new Error("Value must be a hex string");
	}
	const hex = value.slice(2);
	if (hex.length === 0) {
		return "0x";
	}
	// Remove leading zeros but keep at least one character
	const trimmed = hex.replace(/^0+/, "");
	return `0x${trimmed.length === 0 ? "0" : trimmed}`;
}

export function main(): void {
	// Trim empty (edge case)
	trimLeft(empty);

	// Trim value with no leading zeros
	trimLeft(noLeadingZeros);

	// Trim value with leading zeros
	trimLeft(leadingZeros);

	// Trim all zeros
	trimLeft(allZeros);

	// Trim 32-byte value with leading zeros
	trimLeft(thirtyTwo);
}
