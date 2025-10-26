import { fromRlp } from "viem";

// Test data: RLP-encoded values as hex strings
const testEncoded1 = "0x821234";
const testEncoded2 = "0x850102030405";
const testEncoded3 = "0x2a";
const testEncodedList = "0xc67f7f838081e8";

export function main(): void {
	fromRlp(testEncoded1, "hex");
	fromRlp(testEncoded2, "hex");
	fromRlp(testEncoded3, "hex");
	fromRlp(testEncodedList, "hex");
}
