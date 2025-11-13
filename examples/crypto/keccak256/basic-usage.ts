import { Keccak256 } from "../../../src/crypto/Keccak256/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const data = Hex("0x0102030405");
const hash = Keccak256.hashHex(data);
const message = "hello";
const messageHash = Keccak256.hashString(message);

// Verify against known test vector
const expectedHello =
	"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8";
const isCorrect = Hex.fromBytes(messageHash) === expectedHello;
const hexInput = "0xdeadbeef";
const hexHash = Keccak256.hashHex(hexInput);
const emptyHash = Keccak256.hashString("");

// This is the EMPTY_KECCAK256 constant used throughout Ethereum
const expectedEmpty =
	"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
const input = "test";
const hash1 = Keccak256.hashString(input);
const hash2 = Keccak256.hashString(input);
const hash3 = Keccak256.hashString(input);
const original = "The quick brown fox jumps over the lazy dog";
const modified = "The quick brown fox jumps over the lazy doh"; // Changed last letter

const originalHash = Keccak256.hashString(original);
const modifiedHash = Keccak256.hashString(modified);

// Count differing bits
let differentBits = 0;
for (let i = 0; i < 32; i++) {
	const xor = originalHash[i] ^ modifiedHash[i];
	differentBits += xor.toString(2).split("1").length - 1;
}
