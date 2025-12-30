/**
 * Tests for docs/primitives/hash.mdx
 *
 * This MDX file is a MIGRATION GUIDE showing the transition from Hash to Keccak256.
 * Tests validate both the OLD (Hash) API and NEW (Keccak256) API as documented.
 *
 * API DISCREPANCIES FOUND:
 * - Docs show `Keccak256.hash()` but actual API exports `hash` directly, not as method
 * - Docs reference '@tevm/voltaire/Keccak256' but actual import is from src path
 * - Hash.keccak256() in docs but actual API has Hash.keccak256() (correct)
 * - Docs show hash.toHex() as method but it's actually Hash.toHex(hash) (data-first)
 * - Docs show `Keccak256Hash.toHex(hash)` but Keccak256Hash uses Hex.toHex pattern
 * - Docs show `Keccak256Hash.isKeccak256Hash()` but it's just type guard check
 */
import { describe, expect, it } from "vitest";

describe("Hash Migration Guide - hash.mdx", () => {
	describe("Old API - Hash namespace", () => {
		it("should hash data with Hash.keccak256()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should hash hex with Hash.keccak256Hex()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// Hash from hex string
			const hashFromHex = Hash.keccak256Hex("0x01020304");

			expect(hashFromHex).toBeInstanceOf(Uint8Array);
			expect(hashFromHex.length).toBe(32);
		});

		it("should hash string with Hash.keccak256String()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const hashFromString = Hash.keccak256String("hello");

			expect(hashFromString).toBeInstanceOf(Uint8Array);
			expect(hashFromString.length).toBe(32);
		});

		it("should create hash from hex string with Hash.from()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			// 32-byte hash as hex
			const hashHex =
				"0x0000000000000000000000000000000000000000000000000000000000001234";
			const hash = Hash.from(hashHex);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should create hash from bytes with Hash.fromBytes()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const bytes = new Uint8Array(32).fill(0x12);
			const hash = Hash.fromBytes(bytes);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should convert hash to hex with Hash.toHex()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);
			// DOC NOTE: Docs show hash.toHex() but actual API is data-first: Hash.toHex(hash)
			const hex = Hash.toHex(hash);

			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("should validate with Hash.isHash()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);
			const isValid = Hash.isHash(hash);

			expect(isValid).toBe(true);
			expect(Hash.isHash(new Uint8Array(16))).toBe(false); // wrong size
			expect(Hash.isHash("not a hash")).toBe(false);
		});
	});

	describe("New API - Keccak256 namespace", () => {
		it("should hash data with Keccak256.hash()", async () => {
			const { hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const data = new Uint8Array([1, 2, 3, 4]);
			const result = hash(data);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("should hash hex with Keccak256.hashHex()", async () => {
			const { hashHex } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const result = hashHex("0x01020304");

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("should hash string with Keccak256.hashString()", async () => {
			const { hashString } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const result = hashString("hello");

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("should use Keccak256Hash namespace", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			// Primary API - type-safe constructors
			const data = new Uint8Array([1, 2, 3, 4]);
			const hash1 = Keccak256Hash.hash(data);
			const hash2 = Keccak256Hash.hashString("hello");
			const hash3 = Keccak256Hash.hashHex("0x01020304");

			expect(hash1.length).toBe(32);
			expect(hash2.length).toBe(32);
			expect(hash3.length).toBe(32);
		});

		it("should use Keccak256Hash.from() for hex input", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			// DOC NOTE: Docs show Keccak256Hash.from('0x1234...') for hex parsing
			// but Keccak256Hash.from actually hashes the input, use fromHex for parsing
			const hashFromHex = Keccak256Hash.fromHex("0x01020304");

			expect(hashFromHex).toBeInstanceOf(Uint8Array);
			expect(hashFromHex.length).toBe(32);
		});

		it("should use Keccak256Hash.fromString() for string hashing", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const hash = Keccak256Hash.fromString("hello");

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});
	});

	describe("Migration - Old vs New equivalence", () => {
		it("should produce same hash from Hash.keccak256() and Keccak256.hash()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");
			const { hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const data = new Uint8Array([1, 2, 3, 4]);
			const oldHash = Hash.keccak256(data);
			const newHash = hash(data);

			expect(Hash.toHex(oldHash)).toBe(
				`0x${Array.from(newHash, (b) => b.toString(16).padStart(2, "0")).join("")}`,
			);
		});

		it("should produce same hash from Hash.keccak256String() and Keccak256.hashString()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");
			const { hashString } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const oldHash = Hash.keccak256String("hello");
			const newHash = hashString("hello");

			expect(Hash.toHex(oldHash)).toBe(
				`0x${Array.from(newHash, (b) => b.toString(16).padStart(2, "0")).join("")}`,
			);
		});

		it("should produce same hash from Hash.keccak256Hex() and Keccak256.hashHex()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");
			const { hashHex } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const oldHash = Hash.keccak256Hex("0x01020304");
			const newHash = hashHex("0x01020304");

			expect(Hash.toHex(oldHash)).toBe(
				`0x${Array.from(newHash, (b) => b.toString(16).padStart(2, "0")).join("")}`,
			);
		});
	});

	describe("Complete Example from Docs", () => {
		it("should run old approach example", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);
			// DOC BUG: Docs show `hash.toHex()` but actual API is data-first
			const hex = Hash.toHex(hash);
			const isValid = Hash.isHash(hash);

			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
			expect(isValid).toBe(true);
		});

		it("should run new approach example", async () => {
			const { hash, Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);
			const { fromBytes } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			const data = new Uint8Array([1, 2, 3, 4]);
			const result = hash(data);
			// DOC NOTE: Docs show Keccak256Hash.toHex(hash) but actual API uses Hex.fromBytes
			const hex = fromBytes(result);
			// DOC NOTE: Docs show Keccak256Hash.isKeccak256Hash(hash) but
			// validation is done via type system or size check
			const isValid = result instanceof Uint8Array && result.length === 32;

			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
			expect(isValid).toBe(true);
		});
	});

	describe("Type Hierarchy - Keccak256Hash extends Bytes32", () => {
		it("should work with Bytes32 operations", async () => {
			const { hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);
			const { fromBytes } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			const data = new Uint8Array([1, 2, 3, 4]);
			const keccakHash = hash(data);

			// Bytes32-compatible operations via Hex namespace (fromBytes converts to hex)
			const hex = fromBytes(keccakHash);

			expect(keccakHash.length).toBe(32);
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("should check if hash is zero", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const zeroHash = Hash.ZERO;
			const isZero = Hash.isZero(zeroHash);

			expect(isZero).toBe(true);
		});
	});

	describe("Ethereum-specific Methods on Keccak256Hash", () => {
		it("should compute function selector", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const selector = Keccak256Hash.selector("transfer(address,uint256)");

			// Selector is first 4 bytes of keccak256 hash
			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
		});

		it("should compute event topic", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);

			const topic = Keccak256Hash.topic(
				"Transfer(address,address,uint256)",
			);

			// Topic is full 32-byte keccak256 hash
			expect(topic).toBeInstanceOf(Uint8Array);
			expect(topic.length).toBe(32);
		});

		it("should compute CREATE contract address", async () => {
			const { Keccak256Hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);

			const deployer = Address.from(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
			);
			const nonce = 0n;
			const contractAddr = Keccak256Hash.contractAddress(deployer, nonce);

			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("should compute CREATE2 contract address", async () => {
			const { Keccak256Hash, hash } = await import(
				"../../../src/crypto/Keccak256/index.js"
			);
			const { Address } = await import(
				"../../../src/primitives/Address/index.js"
			);
			const { toBytes } = await import(
				"../../../src/primitives/Hex/index.js"
			);

			const deployer = Address.from(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
			);
			const salt = toBytes(
				"0x0000000000000000000000000000000000000000000000000000000000001234",
			);
			const initCode = toBytes("0x6080604052348015600f57600080fd5b50");
			// DOC NOTE: create2Address expects initCodeHash (32 bytes), not initCode
			const initCodeHash = hash(initCode);

			const contractAddr = Keccak256Hash.create2Address(
				deployer,
				salt,
				initCodeHash,
			);

			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	describe("Hash Constants", () => {
		it("should have SIZE constant", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			expect(Hash.SIZE).toBe(32);
		});

		it("should have ZERO constant", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			expect(Hash.ZERO).toBeInstanceOf(Uint8Array);
			expect(Hash.ZERO.length).toBe(32);
			expect(Hash.ZERO.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Additional Hash Methods", () => {
		it("should check equality with Hash.equals()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash1 = Hash.keccak256(data);
			const hash2 = Hash.keccak256(data);
			const hash3 = Hash.keccak256(new Uint8Array([5, 6, 7, 8]));

			expect(Hash.equals(hash1, hash2)).toBe(true);
			expect(Hash.equals(hash1, hash3)).toBe(false);
		});

		it("should clone hash with Hash.clone()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);
			const cloned = Hash.clone(hash);

			expect(Hash.equals(hash, cloned)).toBe(true);
			expect(hash).not.toBe(cloned); // Different reference
		});

		it("should generate random hash with Hash.random()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const random1 = Hash.random();
			const random2 = Hash.random();

			expect(random1).toBeInstanceOf(Uint8Array);
			expect(random1.length).toBe(32);
			expect(Hash.equals(random1, random2)).toBe(false);
		});

		it("should slice hash with Hash.slice()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const data = new Uint8Array([1, 2, 3, 4]);
			const hash = Hash.keccak256(data);
			const sliced = Hash.slice(hash, 0, 4);

			expect(sliced).toBeInstanceOf(Uint8Array);
			expect(sliced.length).toBe(4);
		});

		it("should compute merkle root with Hash.merkleRoot()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const leaf1 = Hash.keccak256(new Uint8Array([1]));
			const leaf2 = Hash.keccak256(new Uint8Array([2]));
			const root = Hash.merkleRoot([leaf1, leaf2]);

			expect(root).toBeInstanceOf(Uint8Array);
			expect(root.length).toBe(32);
		});

		it("should concat hashes with Hash.concat()", async () => {
			const Hash = await import("../../../src/primitives/Hash/index.js");

			const hash1 = Hash.keccak256(new Uint8Array([1]));
			const hash2 = Hash.keccak256(new Uint8Array([2]));
			const combined = Hash.concat(hash1, hash2);

			// concat returns keccak256 of concatenated hashes
			expect(combined).toBeInstanceOf(Uint8Array);
			expect(combined.length).toBe(32);
		});
	});
});
