import { size } from "viem";

// Test data: various byte arrays
const bytesEmpty = "0x";
const bytes1 = "0xff";
const bytes32 = "0x" + "00".repeat(32);
const bytes1024 = "0x" + "00".repeat(1024);

export function main(): void {
	size(bytesEmpty);
	size(bytes1);
	size(bytes32);
	size(bytes1024);
}
