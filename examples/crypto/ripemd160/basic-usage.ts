import { Ripemd160 } from "../../../src/crypto/Ripemd160/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Ripemd160.hash(data);
const message = "hello";
const messageHash = Ripemd160.hashString(message);
const emptyHash = Ripemd160.hashString("");

// Verify against official test vector
const expectedEmpty = "0x9c1185a5c5e9fc54612808977ee8f548b2258d31";
const isCorrect = Hex.fromBytes(emptyHash) === expectedEmpty;

const testVectors = [
	{ input: "a", expected: "0x0bdc9d2d256b3ee9daae347be6f4dc835a467ffe" },
	{ input: "abc", expected: "0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc" },
	{
		input: "message digest",
		expected: "0x5d0689ef49d2fae572b881b123a85ffa21595f36",
	},
];

testVectors.forEach(({ input, expected }) => {
	const hash = Ripemd160.hashString(input);
	const matches = Hex.fromBytes(hash) === expected;
});
const input = "Bitcoin uses RIPEMD160";
const hash1 = Ripemd160.hashString(input);
const hash2 = Ripemd160.hashString(input);
const hash3 = Ripemd160.hashString(input);
const shortInput = "a";
const longInput = "The quick brown fox jumps over the lazy dog";

const shortHash = Ripemd160.hashString(shortInput);
const longHash = Ripemd160.hashString(longInput);
