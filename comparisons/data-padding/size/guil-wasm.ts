// Test data: various sizes
const empty = "0x";
const short = "0x01";
const medium = "0xabcd";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const long = "0x" + "ff".repeat(128);

// Manual size implementation
function getSize(value: string): number {
	if (!value.startsWith("0x")) {
		throw new Error("Value must be a hex string");
	}
	const hex = value.slice(2);
	// Each pair of hex characters is one byte
	return Math.ceil(hex.length / 2);
}

export function main(): void {
	// Get size of empty
	getSize(empty);

	// Get size of short value
	getSize(short);

	// Get size of medium value
	getSize(medium);

	// Get size of 32-byte value
	getSize(thirtyTwo);

	// Get size of long value
	getSize(long);
}
