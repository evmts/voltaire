import { toRlp } from "viem";

// Test data: various input types to encode and convert to hex
// viem toRlp already returns hex string by default
const testString = "0x1234";
const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
const testNumber = "0x2a";
const testList = ["0x1234", new Uint8Array([1, 2, 3]), "0x2a"];

export function main(): void {
	toRlp(testString);
	toRlp(testBytes);
	toRlp(testNumber);
	toRlp(testList);
}
