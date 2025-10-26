import { decodeRlp } from "ethers";

// Test data: RLP-encoded values as hex strings
const testEncoded1 = "0x821234";
const testEncoded2 = "0x850102030405";
const testEncoded3 = "0x2a";

export function main(): void {
	decodeRlp(testEncoded1);
	decodeRlp(testEncoded2);
	decodeRlp(testEncoded3);
}
