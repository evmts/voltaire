import { toHex } from "../../../native/primitives/rlp.js";

// Test data: various input types to encode and convert to hex
const testString = "0x1234";
const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
const testNumber = 42;
const testList = ["0x1234", new Uint8Array([1, 2, 3]), 42];

export function main(): void {
	toHex(testString);
	toHex(testBytes);
	toHex(testNumber);
	toHex(testList);
}
