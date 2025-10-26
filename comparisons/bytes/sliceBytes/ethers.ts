import { dataSlice } from "ethers";

// Test data: various byte arrays to slice
const bytes32 = "0x" + "00".repeat(32);
const bytes1024 = "0x" + "00".repeat(1024);

export function main(): void {
	// Slice first 4 bytes
	dataSlice(bytes32, 0, 4);

	// Slice middle bytes
	dataSlice(bytes32, 4, 20);

	// Slice from position to end
	dataSlice(bytes32, 16);

	// Slice larger array
	dataSlice(bytes1024, 0, 256);
	dataSlice(bytes1024, 256, 512);
	dataSlice(bytes1024, 512);
}
