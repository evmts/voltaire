import {
	encodeBytes,
	toHex,
} from "../../../src/typescript/native/primitives/rlp.native.js";

// Test data: byte arrays to encode
const testBytes1 = new Uint8Array([0x12, 0x34]);
const testBytes2 = new Uint8Array([1, 2, 3, 4, 5]);
const testBytes3 = new Uint8Array([42]);

export function main(): void {
	// Encode bytes and convert to hex
	toHex(encodeBytes(testBytes1));
	toHex(encodeBytes(testBytes2));
	toHex(encodeBytes(testBytes3));
}
