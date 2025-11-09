/**
 * SHA256 NIST Test Vectors
 *
 * Validates implementation against official NIST FIPS 180-4 test vectors:
 * - Empty string
 * - Short messages
 * - Messages at block boundaries
 * - Large messages (1 million 'a' characters)
 */

import { SHA256 } from "../../../src/crypto/sha256/SHA256.js";

interface TestVector {
	name: string;
	input: string;
	expected: string;
}

const testVectors: TestVector[] = [
	{
		name: "Empty string",
		input: "",
		expected:
			"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
	},
	{
		name: "abc",
		input: "abc",
		expected:
			"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
	},
	{
		name: "hello world",
		input: "hello world",
		expected:
			"0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
	},
	{
		name: "448-bit message",
		input: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
		expected:
			"0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
	},
	{
		name: "896-bit message",
		input:
			"abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
		expected:
			"0xcf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1",
	},
];

let passed = 0;
let failed = 0;

for (const vector of testVectors) {
	const hash = SHA256.hashString(vector.input);
	const result = SHA256.toHex(hash);

	const isMatch = result === vector.expected;

	if (vector.input.length <= 50) {
	} else {
	}

	if (isMatch) {
		passed++;
	} else {
		failed++;
	}
}

const largeInput = "a".repeat(1000000);
const largeExpected =
	"0xcdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0";

const start = performance.now();
const largeHash = SHA256.hashString(largeInput);
const elapsed = performance.now() - start;

const largeResult = SHA256.toHex(largeHash);
const isLargeMatch = largeResult === largeExpected;

if (isLargeMatch) {
	passed++;
} else {
	failed++;
}

const hasher = SHA256.create();
const chunkSize = 10000;
for (let i = 0; i < 100; i++) {
	hasher.update(new TextEncoder().encode("a".repeat(chunkSize)));
}
const streamingHash = hasher.digest();
const streamingResult = SHA256.toHex(streamingHash);

if (streamingResult === largeExpected) {
	passed++;
} else {
	failed++;
}

const edgeCases = [
	{
		name: "Single byte (0x00)",
		input: new Uint8Array([0x00]),
		expected:
			"0x6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
	},
	{
		name: "All zeros (32 bytes)",
		input: new Uint8Array(32).fill(0x00),
		expected:
			"0x66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925",
	},
	{
		name: "All ones (32 bytes)",
		input: new Uint8Array(32).fill(0xff),
		expected:
			"0xaf9613760f72635fbdb44a5a0a63c39f12af30f950a6ee5c971be188e89c4051",
	},
];

for (const test of edgeCases) {
	const hash = SHA256.hash(test.input);
	const result = SHA256.toHex(hash);
	const isMatch = result === test.expected;
	if (!isMatch) {
	}

	if (isMatch) {
		passed++;
	} else {
		failed++;
	}
}

const unicodeTests = [
	{
		name: "Emoji 🚀",
		input: "🚀",
		// UTF-8: F0 9F 9A 80
		bytes: new Uint8Array([0xf0, 0x9f, 0x9a, 0x80]),
	},
	{
		name: "Chinese 你好",
		input: "你好",
		// UTF-8: E4 BD A0 E5 A5 BD
		bytes: new Uint8Array([0xe4, 0xbd, 0xa0, 0xe5, 0xa5, 0xbd]),
	},
];

for (const test of unicodeTests) {
	const stringHash = SHA256.hashString(test.input);
	const bytesHash = SHA256.hash(test.bytes);
	const isMatch = SHA256.toHex(stringHash) === SHA256.toHex(bytesHash);

	if (isMatch) {
		passed++;
	} else {
		failed++;
	}
}

if (failed === 0) {
} else {
}
