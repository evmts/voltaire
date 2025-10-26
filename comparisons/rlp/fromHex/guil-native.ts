import { fromHex } from "../../../src/typescript/native/primitives/rlp.native.js";

// Test data: RLP-encoded values as hex strings
const testEncoded1 = "0x821234";
const testEncoded2 = "0x850102030405";
const testEncoded3 = "0x2a";
const testEncodedList = "0xc67f7f838081e8";

export function main(): void {
	fromHex(testEncoded1);
	fromHex(testEncoded2);
	fromHex(testEncoded3);
	fromHex(testEncodedList);
}
