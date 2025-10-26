import { decode } from "../../../src/primitives/rlp.js";

// Test data: RLP-encoded values
// 0x821234 = RLP encoding of 0x1234
// 0x850102030405 = RLP encoding of [1,2,3,4,5]
// 0x2a = RLP encoding of 42 (single byte < 0x80)
const testEncoded1 = new Uint8Array([0x82, 0x12, 0x34]);
const testEncoded2 = new Uint8Array([0x85, 0x01, 0x02, 0x03, 0x04, 0x05]);
const testEncoded3 = new Uint8Array([0x2a]);

export function main(): void {
	decode(testEncoded1);
	decode(testEncoded2);
	decode(testEncoded3);
}
