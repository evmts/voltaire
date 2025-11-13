/**
 * SHA256 Basic Usage Examples
 *
 * Demonstrates fundamental SHA-256 operations:
 * - Hashing raw bytes
 * - Hashing strings
 * - Hashing hex strings
 * - Converting output to hex
 */

import { SHA256 } from "../../../src/crypto/sha256/SHA256.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const data = Hex("0x0102030405");
const hash1 = SHA256.hashHex(data);
const message = "hello world";
const hash2 = SHA256.hashString(message);

// Verify NIST test vector
const abcHash = SHA256.hashString("abc");
const expectedAbc =
	"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
const hexData = "0xdeadbeef";
const hash3 = SHA256.hashHex(hexData);

// Also works without 0x prefix
const hash4 = SHA256.hashHex("DEADBEEF");
const emptyHash = SHA256.hashString("");
const expectedEmpty =
	"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
const emoji = SHA256.hashString("🚀");
const chinese = SHA256.hashString("你好");
const input = Hex("0x2a2a2a");
const hashA = SHA256.hashHex(input);
const hashB = SHA256.hashHex(input);
const hashC = SHA256.hashHex(input);
const input1 = Hex("0x0102030405");
const input2 = Hex("0x0102030406"); // Last byte different
const hashInput1 = SHA256.hashHex(input1);
const hashInput2 = SHA256.hashHex(input2);

// Count differing bits
let differingBits = 0;
for (let i = 0; i < 32; i++) {
	const xor = hashInput1[i] ^ hashInput2[i];
	differingBits += xor.toString(2).split("1").length - 1;
}
