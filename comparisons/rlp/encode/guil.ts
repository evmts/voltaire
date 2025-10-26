import { encode } from "../../../src/primitives/rlp.js";

// Test data: strings, numbers, and byte arrays
const testString = "0x1234";
const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
const testNumber = 42;

export function main(): void {
	encode(testString);
	encode(testBytes);
	encode(testNumber);
}
