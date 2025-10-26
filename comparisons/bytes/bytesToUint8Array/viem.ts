import { hexToBytes } from "viem";

// Test data: various byte arrays
const bytes1 = "0xff";
const bytes32 = "0x" + "00".repeat(32);
const bytes1024 = "0x" + "00".repeat(1024);
const bytesEmpty = "0x";

export function main(): void {
	hexToBytes(bytesEmpty);
	hexToBytes(bytes1);
	hexToBytes(bytes32);
	hexToBytes(bytes1024);
}
