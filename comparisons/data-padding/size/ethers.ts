import { dataLength } from "ethers";

// Test data: various sizes
const empty = "0x";
const short = "0x01";
const medium = "0xabcd";
const thirtyTwo =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const long = `0x${"ff".repeat(128)}`;

export function main(): void {
	// Get size of empty
	dataLength(empty);

	// Get size of short value
	dataLength(short);

	// Get size of medium value
	dataLength(medium);

	// Get size of 32-byte value
	dataLength(thirtyTwo);

	// Get size of long value
	dataLength(long);
}
