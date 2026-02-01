/**
 * Tests for docs/crypto/keccak256/index.mdx
 *
 * Validates that all code examples in the Keccak256 documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("Keccak256 Documentation - index.mdx", () => {
	describe("Quick Start - Basic Hashing", () => {
		it("should hash bytes", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const data = Hex.toBytes("0x0102030405");
			const hash = Keccak256.hash(data);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should hash string (UTF-8 encoded)", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const stringHash = Keccak256.hashString("hello");

			expect(stringHash.length).toBe(32);
			// Known hash of "hello"
			expect(Hex.fromBytes(stringHash)).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			);
		});

		it("should hash hex string", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hexHash = Keccak256.hashHex("0x1234abcd");

			expect(hexHash.length).toBe(32);
		});
	});

	describe("Quick Start - Ethereum Functions", () => {
		it("should compute function selector", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const selector = Keccak256.selector("transfer(address,uint256)");

			expect(selector.length).toBe(4);
			expect(Hex.fromBytes(selector)).toBe("0xa9059cbb");
		});

		it("should compute event topic", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const topic = Keccak256.topic("Transfer(address,address,uint256)");

			expect(topic.length).toBe(32);
			expect(Hex.fromBytes(topic)).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});

		it("should calculate contract address (CREATE)", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Address } = await import("../../../src/primitives/Address/index.js");

			const deployer = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
			const nonce = 5n;
			const contractAddr = Keccak256.contractAddress(deployer, nonce);

			expect(contractAddr.length).toBe(20);
		});

		it("should calculate contract address (CREATE2)", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Address } = await import("../../../src/primitives/Address/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const deployer = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
			const salt = Hex.toBytes(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const initCode = Hex.toBytes(
				"0x60806040523480156100105760006000fd5b50610015565b60c3806100236000396000f3fe",
			);

			// DOC BUG: create2Address expects init code HASH (32 bytes), not raw init code
			const initCodeHash = Keccak256.hash(initCode);
			const create2Addr = Keccak256.create2Address(deployer, salt, initCodeHash);

			expect(create2Addr.length).toBe(20);
		});
	});

	describe("Quick Start - Multiple Chunks", () => {
		it("should hash multiple data chunks", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const chunk1 = Hex.toBytes("0x010203");
			const chunk2 = Hex.toBytes("0x040506");
			const chunk3 = Hex.toBytes("0x070809");

			const hashMultiple = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);

			// Should be equivalent to hashing the concatenation
			const concatenated = Hex.toBytes("0x010203040506070809");
			const hashConcat = Keccak256.hash(concatenated);

			expect(Hex.fromBytes(hashMultiple)).toBe(Hex.fromBytes(hashConcat));
		});
	});

	describe("API - Legacy Methods (still supported)", () => {
		it("Keccak256.hash should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.hash(Hex.toBytes("0x010203"));
			expect(hash.length).toBe(32);
		});

		it("Keccak256.hashString should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hash = Keccak256.hashString("hello");
			expect(hash.length).toBe(32);
		});

		it("Keccak256.hashHex should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hash = Keccak256.hashHex("0x1234");
			expect(hash.length).toBe(32);
		});

		it("Keccak256.hashMultiple should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hash = Keccak256.hashMultiple([
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
			]);
			expect(hash.length).toBe(32);
		});

		it("Keccak256.topic should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const topic = Keccak256.topic("Transfer(address,address,uint256)");
			expect(topic.length).toBe(32);
		});
	});

	describe("Constants", () => {
		it("should have DIGEST_SIZE constant", async () => {
			const { DIGEST_SIZE } = await import("../../../src/crypto/Keccak256/index.js");

			expect(DIGEST_SIZE).toBe(32);
		});

		it("should have RATE constant", async () => {
			const { RATE } = await import("../../../src/crypto/Keccak256/index.js");

			expect(RATE).toBe(136);
		});

		it("should have STATE_SIZE constant", async () => {
			const { STATE_SIZE } = await import("../../../src/crypto/Keccak256/index.js");

			expect(STATE_SIZE).toBe(25);
		});
	});

	describe("Test Vectors", () => {
		it("empty string hash", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.hashString("");

			expect(Hex.fromBytes(hash)).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("'abc' hash", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.hashString("abc");

			expect(Hex.fromBytes(hash)).toBe(
				"0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
			);
		});

		it("'hello' hash", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.hashString("hello");

			expect(Hex.fromBytes(hash)).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			);
		});

		it("long string hash", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.hashString(
				"The quick brown fox jumps over the lazy dog",
			);

			expect(Hex.fromBytes(hash)).toBe(
				"0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15",
			);
		});

		it("transfer selector", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const selector = Keccak256.selector("transfer(address,uint256)");

			expect(selector[0]).toBe(0xa9);
			expect(selector[1]).toBe(0x05);
			expect(selector[2]).toBe(0x9c);
			expect(selector[3]).toBe(0xbb);
			expect(Hex.fromBytes(selector)).toBe("0xa9059cbb");
		});
	});

	describe("New API (Keccak256.from*, Keccak256.fromTopic)", () => {
		it("Keccak256.from should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const hash = Keccak256.from(Hex.toBytes("0x010203"));
			expect(hash.length).toBe(32);
		});

		it("Keccak256.fromString should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hash = Keccak256.fromString("hello");
			expect(hash.length).toBe(32);
		});

		it("Keccak256.fromHex should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");

			const hash = Keccak256.fromHex("0x1234");
			expect(hash.length).toBe(32);
		});

		it("Keccak256.fromTopic should work", async () => {
			const { Keccak256 } = await import("../../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const topic = Keccak256.fromTopic("Transfer(address,address,uint256)");
			expect(topic.length).toBe(32);
			expect(Hex.fromBytes(topic)).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});
	});
});
