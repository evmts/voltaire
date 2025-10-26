import { getBytes, zeroPadBytes } from "ethers";

// Test data: various sizes to pad
const empty = "0x";
const short = "0x01";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const trailingZeros = "0xabcd000000";

export function main(): void {
	// Pad empty to 32 bytes
	zeroPadBytes(getBytes(empty), 32);

	// Pad short to 32 bytes
	zeroPadBytes(getBytes(short), 32);

	// Pad already 32-byte value (no-op)
	zeroPadBytes(getBytes(thirtyTwo), 32);

	// Pad value with trailing zeros
	zeroPadBytes(getBytes(trailingZeros), 32);
}
