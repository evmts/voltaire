/**
 * Keccak256 Tests
 *
 * Comprehensive tests for Keccak256 implementation including:
 * - Known test vectors
 * - Different input types (Uint8Array, string, hex)
 * - Edge cases (empty input, large input, unicode)
 * - Ethereum-specific utilities (selectors, topics, addresses)
 * - Cross-validation between Noble and WASM implementations
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { equals } from "../primitives/Hash/equals.js";
import { fromHex } from "../primitives/Hash/fromHex.js";
import { isHash } from "../primitives/Hash/isHash.js";
import { Keccak256 } from "./Keccak256/index.js";
import { Keccak256Wasm } from "./keccak256.wasm.js";

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
	await Keccak256Wasm.init();
});

// ============================================================================
// Parameterized Test Helper
// ============================================================================

type Implementation = {
	name: string;
	impl: typeof Keccak256;
};

const implementations: Implementation[] = [
	{ name: "Noble", impl: Keccak256 },
	{ name: "WASM", impl: Keccak256Wasm as unknown as typeof Keccak256 },
];

function testBoth(testName: string, testFn: (impl: typeof Keccak256) => void) {
	for (const { name, impl } of implementations) {
		test(`${testName} [${name}]`, () => testFn(impl));
	}
}

// ============================================================================
// Test Vectors
// ============================================================================

describe("Keccak256 - Known Test Vectors", () => {
	testBoth("empty string", (impl) => {
		const result = impl.hashString("");
		const expected = fromHex(
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("abc", (impl) => {
		const result = impl.hashString("abc");
		const expected = fromHex(
			"0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("hello", (impl) => {
		const result = impl.hashString("hello");
		const expected = fromHex(
			"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("The quick brown fox jumps over the lazy dog", (impl) => {
		const result = impl.hashString(
			"The quick brown fox jumps over the lazy dog",
		);
		const expected = fromHex(
			"0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("zero byte", (impl) => {
		const result = impl.hash(new Uint8Array([0x00]));
		const expected = fromHex(
			"0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("0xff byte", (impl) => {
		const result = impl.hash(new Uint8Array([0xff]));
		const expected = fromHex(
			"0x8b1a944cf13a9a1c08facb2c9e98623ef3254d2ddb48113885c3e8e97fec8db9",
		);
		expect(equals(result, expected)).toBe(true);
	});
});

// ============================================================================
// Input Types
// ============================================================================

describe("Keccak256 - Input Types", () => {
	testBoth("hash - Uint8Array input", (impl) => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const result = impl.hash(data);
		expect(isHash(result)).toBe(true);
		expect(result.length).toBe(32);
	});

	testBoth("hashString - UTF-8 encoding", (impl) => {
		const result = impl.hashString("test");
		expect(isHash(result)).toBe(true);
		expect(result.length).toBe(32);
	});

	testBoth("hashHex - with 0x prefix", (impl) => {
		const result = impl.hashHex("0x1234");
		const expected = impl.hash(new Uint8Array([0x12, 0x34]));
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("hashHex - without prefix", (impl) => {
		const result = impl.hashHex("1234");
		const expected = impl.hash(new Uint8Array([0x12, 0x34]));
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("hashHex - throws on odd length", (impl) => {
		expect(() => impl.hashHex("0x123")).toThrow("even length");
	});

	testBoth("hashHex - throws on invalid chars", (impl) => {
		expect(() => impl.hashHex("0xzzz")).toThrow("Invalid hex");
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Keccak256 - Edge Cases", () => {
	testBoth("empty data", (impl) => {
		const result = impl.hash(new Uint8Array(0));
		const expected = fromHex(
			"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("single byte", (impl) => {
		const result = impl.hash(new Uint8Array([0x42]));
		expect(isHash(result)).toBe(true);
	});

	testBoth("exactly at rate boundary (136 bytes)", (impl) => {
		const data = new Uint8Array(136);
		data.fill(0x61); // 'a'
		const result = impl.hash(data);
		expect(isHash(result)).toBe(true);
	});

	testBoth("one byte over rate boundary", (impl) => {
		const data = new Uint8Array(137);
		data.fill(0x61);
		const result = impl.hash(data);
		expect(isHash(result)).toBe(true);
	});

	testBoth("one byte under rate boundary", (impl) => {
		const data = new Uint8Array(135);
		data.fill(0x61);
		const result = impl.hash(data);
		expect(isHash(result)).toBe(true);
	});

	testBoth("large input (1MB)", (impl) => {
		const data = new Uint8Array(1024 * 1024);
		for (let i = 0; i < data.length; i++) {
			data[i] = i & 0xff;
		}
		const result = impl.hash(data);
		expect(isHash(result)).toBe(true);
	});

	testBoth("unicode string", (impl) => {
		const result = impl.hashString("Hello 世界 🌍");
		expect(isHash(result)).toBe(true);
	});

	testBoth("string with newlines", (impl) => {
		const result = impl.hashString("line1\nline2\nline3");
		expect(isHash(result)).toBe(true);
	});

	testBoth("string with null bytes", (impl) => {
		const result = impl.hashString("test\x00data");
		expect(isHash(result)).toBe(true);
	});
});

// ============================================================================
// Multiple Chunks
// ============================================================================

describe("Keccak256 - Multiple Chunks", () => {
	testBoth("hashMultiple - equivalent to concatenation", (impl) => {
		const chunk1 = new Uint8Array([1, 2, 3]);
		const chunk2 = new Uint8Array([4, 5, 6]);
		const chunk3 = new Uint8Array([7, 8, 9]);

		const resultMultiple = impl.hashMultiple([chunk1, chunk2, chunk3]);
		const resultSingle = impl.hash(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));

		expect(equals(resultMultiple, resultSingle)).toBe(true);
	});

	testBoth("hashMultiple - empty array", (impl) => {
		const result = impl.hashMultiple([]);
		const expected = impl.hash(new Uint8Array(0));
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("hashMultiple - single chunk", (impl) => {
		const chunk = new Uint8Array([1, 2, 3]);
		const resultMultiple = impl.hashMultiple([chunk]);
		const resultSingle = impl.hash(chunk);
		expect(equals(resultMultiple, resultSingle)).toBe(true);
	});
});

// ============================================================================
// Ethereum Utilities
// ============================================================================

describe("Keccak256 - Ethereum Utilities", () => {
	testBoth("selector - transfer function", (impl) => {
		const result = impl.selector("transfer(address,uint256)");
		expect(result.length).toBe(4);
		expect(result[0]).toBe(0xa9);
		expect(result[1]).toBe(0x05);
		expect(result[2]).toBe(0x9c);
		expect(result[3]).toBe(0xbb);
	});

	testBoth("selector - balanceOf function", (impl) => {
		const result = impl.selector("balanceOf(address)");
		expect(result.length).toBe(4);
		expect(result[0]).toBe(0x70);
		expect(result[1]).toBe(0xa0);
		expect(result[2]).toBe(0x82);
		expect(result[3]).toBe(0x31);
	});

	testBoth("topic - Transfer event", (impl) => {
		const result = impl.topic("Transfer(address,address,uint256)");
		const expected = fromHex(
			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("topic - Approval event", (impl) => {
		const result = impl.topic("Approval(address,address,uint256)");
		const expected = fromHex(
			"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
		);
		expect(equals(result, expected)).toBe(true);
	});

	testBoth("contractAddress - basic", (impl) => {
		const sender = new Uint8Array(20);
		sender.fill(0x42);
		const result = impl.contractAddress(sender, 0n);
		expect(result.length).toBe(20);
	});

	testBoth("contractAddress - throws on invalid sender", (impl) => {
		const sender = new Uint8Array(19);
		expect(() => impl.contractAddress(sender, 0n)).toThrow("20 bytes");
	});

	testBoth("create2Address - basic", (impl) => {
		const sender = new Uint8Array(20);
		sender.fill(0x11);
		const salt = new Uint8Array(32);
		salt.fill(0x22);
		const initCodeHash = new Uint8Array(32);
		initCodeHash.fill(0x33);

		const result = impl.create2Address(sender, salt, initCodeHash);
		expect(result.length).toBe(20);
	});

	testBoth("create2Address - throws on invalid sender", (impl) => {
		const sender = new Uint8Array(19);
		const salt = new Uint8Array(32);
		const initCodeHash = new Uint8Array(32);
		expect(() => impl.create2Address(sender, salt, initCodeHash)).toThrow(
			"20 bytes",
		);
	});

	testBoth("create2Address - throws on invalid salt", (impl) => {
		const sender = new Uint8Array(20);
		const salt = new Uint8Array(31);
		const initCodeHash = new Uint8Array(32);
		expect(() => impl.create2Address(sender, salt, initCodeHash)).toThrow(
			"32 bytes",
		);
	});

	testBoth("create2Address - throws on invalid init code hash", (impl) => {
		const sender = new Uint8Array(20);
		const salt = new Uint8Array(32);
		const initCodeHash = new Uint8Array(31);
		expect(() => impl.create2Address(sender, salt, initCodeHash)).toThrow(
			"32 bytes",
		);
	});
});

// ============================================================================
// Consistency
// ============================================================================

describe("Keccak256 - Consistency", () => {
	testBoth("same input produces same output", (impl) => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const result1 = impl.hash(data);
		const result2 = impl.hash(data);
		expect(equals(result1, result2)).toBe(true);
	});

	testBoth("different inputs produce different outputs", (impl) => {
		const data1 = new Uint8Array([1, 2, 3]);
		const data2 = new Uint8Array([1, 2, 4]);
		const result1 = impl.hash(data1);
		const result2 = impl.hash(data2);
		expect(equals(result1, result2)).toBe(false);
	});

	testBoth("modifying input does not affect result", (impl) => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const result = impl.hash(data);
		data[0] = 99;
		const result2 = impl.hash(new Uint8Array([1, 2, 3, 4, 5]));
		expect(equals(result, result2)).toBe(true);
	});
});

// ============================================================================
// Constants
// ============================================================================

describe("Keccak256 - Constants", () => {
	testBoth("DIGEST_SIZE is 32", (impl) => {
		expect(impl.DIGEST_SIZE).toBe(32);
	});

	testBoth("RATE is 136", (impl) => {
		expect(impl.RATE).toBe(136);
	});

	testBoth("STATE_SIZE is 25", (impl) => {
		expect(impl.STATE_SIZE).toBe(25);
	});
});

// ============================================================================
// Cross-validation: Noble vs WASM
// ============================================================================

describe("Keccak256 - Cross-validation", () => {
	test("Noble and WASM produce identical results - basic", () => {
		const data = new Uint8Array([1, 2, 3, 4, 5]);
		const nobleResult = Keccak256.hash(data);
		const wasmResult = Keccak256Wasm.hash(data);
		expect(equals(nobleResult, wasmResult)).toBe(true);
	});

	test("Noble and WASM produce identical results - strings", () => {
		const testStrings = ["", "hello", "The quick brown fox", "世界"];
		for (const str of testStrings) {
			const nobleResult = Keccak256.hashString(str);
			const wasmResult = Keccak256Wasm.hashString(str);
			expect(equals(nobleResult, wasmResult)).toBe(true);
		}
	});

	test("Noble and WASM produce identical results - various sizes", () => {
		const sizes = [0, 1, 4, 20, 32, 64, 128, 135, 136, 137, 256, 512, 1024];
		for (const size of sizes) {
			const data = new Uint8Array(size);
			for (let i = 0; i < size; i++) {
				data[i] = i & 0xff;
			}
			const nobleResult = Keccak256.hash(data);
			const wasmResult = Keccak256Wasm.hash(data);
			expect(equals(nobleResult, wasmResult)).toBe(true);
		}
	});

	test("Noble and WASM produce identical selectors", () => {
		const signatures = [
			"transfer(address,uint256)",
			"balanceOf(address)",
			"approve(address,uint256)",
		];
		for (const sig of signatures) {
			const nobleResult = Keccak256.selector(sig);
			const wasmResult = Keccak256Wasm.selector(sig);
			expect(nobleResult.length).toBe(wasmResult.length);
			for (let i = 0; i < nobleResult.length; i++) {
				expect(Number(nobleResult[i])).toBe(Number(wasmResult[i]));
			}
		}
	});

	test("Noble and WASM produce identical topics", () => {
		const signatures = [
			"Transfer(address,address,uint256)",
			"Approval(address,address,uint256)",
		];
		for (const sig of signatures) {
			const nobleResult = Keccak256.topic(sig);
			const wasmResult = Keccak256Wasm.topic(sig);
			expect(equals(nobleResult, wasmResult)).toBe(true);
		}
	});

	test("Noble and WASM produce identical contract addresses", () => {
		const sender = new Uint8Array(20);
		sender.fill(0x42);
		const nonces = [0n, 1n, 100n, 1000n];
		for (const nonce of nonces) {
			const nobleResult = Keccak256.contractAddress(sender, nonce);
			const wasmResult = Keccak256Wasm.contractAddress(sender, nonce);
			for (let i = 0; i < nobleResult.length; i++) {
				expect(Number(nobleResult[i])).toBe(Number(wasmResult[i]));
			}
		}
	});

	test("Noble and WASM produce identical CREATE2 addresses", () => {
		const sender = new Uint8Array(20);
		sender.fill(0x11);
		const salt = new Uint8Array(32);
		salt.fill(0x22);
		const initCodeHash = new Uint8Array(32);
		initCodeHash.fill(0x33);

		const nobleResult = Keccak256.create2Address(sender, salt, initCodeHash);
		const wasmResult = Keccak256Wasm.create2Address(sender, salt, initCodeHash);
		for (let i = 0; i < nobleResult.length; i++) {
			expect(Number(nobleResult[i])).toBe(Number(wasmResult[i]));
		}
	});
});
