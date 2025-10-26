import { encodeRlp } from "ethers";

// Test data: various input types to encode and convert to hex
// ethers encodeRlp already returns hex string
const testString = "0x1234";
const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
const testNumber = "0x2a";
const testList = ["0x1234", new Uint8Array([1, 2, 3]), "0x2a"];

export function main(): void {
	encodeRlp(testString);
	encodeRlp(testBytes);
	encodeRlp(testNumber);
	encodeRlp(testList);
}
