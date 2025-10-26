// Test data: various sizes to pad
const empty = "0x";
const short = "0x01";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const leadingZeros = "0x000000abcd";

// Manual padLeft implementation
function padLeft(value: string, size: number): string {
	if (!value.startsWith("0x")) {
		throw new Error("Value must be a hex string");
	}
	const hex = value.slice(2);
	const targetLength = size * 2;
	if (hex.length >= targetLength) {
		return value;
	}
	return `0x${"0".repeat(targetLength - hex.length)}${hex}`;
}

export function main(): void {
	// Pad empty to 32 bytes
	padLeft(empty, 32);

	// Pad short to 32 bytes
	padLeft(short, 32);

	// Pad already 32-byte value (no-op)
	padLeft(thirtyTwo, 32);

	// Pad value with leading zeros
	padLeft(leadingZeros, 32);
}
