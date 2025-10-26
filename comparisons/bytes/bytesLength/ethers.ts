import { dataLength } from "ethers";

// Test data: various byte arrays
const bytesEmpty = "0x";
const bytes1 = "0xff";
const bytes32 = "0x" + "00".repeat(32);
const bytes1024 = "0x" + "00".repeat(1024);

export function main(): void {
	dataLength(bytesEmpty);
	dataLength(bytes1);
	dataLength(bytes32);
	dataLength(bytes1024);
}
