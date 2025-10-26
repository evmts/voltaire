import { pad } from "viem";

// Test data: various sizes to pad
const empty = "0x";
const short = "0x01";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const leadingZeros = "0x000000abcd";

export function main(): void {
	// Pad empty to 32 bytes
	pad(empty, { size: 32 });

	// Pad short to 32 bytes
	pad(short, { size: 32 });

	// Pad already 32-byte value (no-op)
	pad(thirtyTwo, { size: 32 });

	// Pad value with leading zeros
	pad(leadingZeros, { size: 32 });
}
