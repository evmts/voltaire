import * as BaseHash from "@tevm/voltaire/Hash";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Hash from "./index.js";

describe("Hash.Hex", () => {
	describe("decode", () => {
		it("parses valid lowercase hex", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("parses valid uppercase hex", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "AB".repeat(32));
			expect(hash.length).toBe(32);
		});

		it("parses valid mixed case hex", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "aB".repeat(32));
			expect(hash.length).toBe(32);
		});

		it("fails on invalid hex", () => {
			expect(() => S.decodeSync(Hash.Hex)("invalid")).toThrow();
		});

		it("fails on wrong length (too short)", () => {
			expect(() => S.decodeSync(Hash.Hex)("0x" + "ab".repeat(16))).toThrow();
		});

		it("fails on wrong length (too long)", () => {
			expect(() => S.decodeSync(Hash.Hex)("0x" + "ab".repeat(64))).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() => S.decodeSync(Hash.Hex)("0x" + "gg".repeat(32))).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "AB".repeat(32));
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex).toBe("0x" + "ab".repeat(32));
		});

		it("produces 0x-prefixed string", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "00".repeat(32));
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(66);
		});
	});

	describe("round-trip", () => {
		it("decode(encode(hash)) === hash", () => {
			const original = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
			const encoded = S.encodeSync(Hash.Hex)(original);
			const decoded = S.decodeSync(Hash.Hex)(encoded);
			expect(BaseHash.equals(original, decoded)).toBe(true);
		});
	});
});

describe("Hash.Bytes", () => {
	describe("decode", () => {
		it("parses 32-byte array", () => {
			const bytes = new Uint8Array(32).fill(0xab);
			const hash = S.decodeSync(Hash.Bytes)(bytes);
			expect(hash.length).toBe(32);
		});

		it("fails on wrong length (too short)", () => {
			const bytes = new Uint8Array(31);
			expect(() => S.decodeSync(Hash.Bytes)(bytes)).toThrow();
		});

		it("fails on wrong length (too long)", () => {
			const bytes = new Uint8Array(33);
			expect(() => S.decodeSync(Hash.Bytes)(bytes)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
			const bytes = S.encodeSync(Hash.Bytes)(hash);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(32);
			expect(bytes[0]).toBe(0xab);
		});
	});

	describe("round-trip", () => {
		it("decode(encode(hash)) === hash", () => {
			const original = S.decodeSync(Hash.Bytes)(new Uint8Array(32).fill(0xcd));
			const encoded = S.encodeSync(Hash.Bytes)(original);
			const decoded = S.decodeSync(Hash.Bytes)(encoded);
			expect(BaseHash.equals(original, decoded)).toBe(true);
		});
	});
});

describe("pure functions", () => {
	const hashA = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
	const hashB = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
	const hashC = S.decodeSync(Hash.Hex)("0x" + "cd".repeat(32));
	const zeroHash = S.decodeSync(Hash.Hex)("0x" + "00".repeat(32));

	describe("isZero", () => {
		it("returns true for zero hash", () => {
			expect(Effect.runSync(Hash.isZero(zeroHash))).toBe(true);
		});

		it("returns false for non-zero hash", () => {
			expect(Effect.runSync(Hash.isZero(hashA))).toBe(false);
		});
	});

	describe("clone", () => {
		it("creates an equal copy", () => {
			const cloned = Effect.runSync(Hash.clone(hashA));
			expect(BaseHash.equals(hashA, cloned)).toBe(true);
		});

		it("creates a distinct object", () => {
			const cloned = Effect.runSync(Hash.clone(hashA));
			expect(cloned).not.toBe(hashA);
		});

		it("modifications to clone do not affect original", () => {
			const cloned = Effect.runSync(Hash.clone(hashA));
			cloned[0] = 0xff;
			expect(hashA[0]).toBe(0xab);
		});
	});

	describe("isValidHex", () => {
		it("returns true for valid 32-byte hex", () => {
			expect(Effect.runSync(Hash.isValidHex("0x" + "ab".repeat(32)))).toBe(
				true,
			);
		});

		it("returns true for zero hash", () => {
			expect(Effect.runSync(Hash.isValidHex("0x" + "00".repeat(32)))).toBe(
				true,
			);
		});

		it("returns false for wrong length", () => {
			expect(Effect.runSync(Hash.isValidHex("0x" + "ab".repeat(16)))).toBe(
				false,
			);
		});

		it("returns false for invalid characters", () => {
			expect(Effect.runSync(Hash.isValidHex("0x" + "gg".repeat(32)))).toBe(
				false,
			);
		});

		it("returns false for empty string", () => {
			expect(Effect.runSync(Hash.isValidHex(""))).toBe(false);
		});
	});
});

describe("keccak256 functions", () => {
	describe("keccak256", () => {
		it("hashes empty bytes", () => {
			const hash = Effect.runSync(Hash.keccak256(new Uint8Array(0)));
			expect(hash.length).toBe(32);
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("hashes single byte", () => {
			const hash = Effect.runSync(Hash.keccak256(new Uint8Array([0x01])));
			expect(hash.length).toBe(32);
		});

		it("produces deterministic output", () => {
			const data = new Uint8Array([1, 2, 3, 4, 5]);
			const hash1 = Effect.runSync(Hash.keccak256(data));
			const hash2 = Effect.runSync(Hash.keccak256(data));
			expect(BaseHash.equals(hash1, hash2)).toBe(true);
		});

		it("produces different output for different input", () => {
			const hash1 = Effect.runSync(Hash.keccak256(new Uint8Array([1])));
			const hash2 = Effect.runSync(Hash.keccak256(new Uint8Array([2])));
			expect(BaseHash.equals(hash1, hash2)).toBe(false);
		});
	});

	describe("keccak256Hex", () => {
		it("hashes hex string", () => {
			const hash = Effect.runSync(Hash.keccak256Hex("0x1234"));
			expect(hash.length).toBe(32);
		});

		it("matches keccak256 for same data", () => {
			const hexHash = Effect.runSync(Hash.keccak256Hex("0x0102030405"));
			const bytesHash = Effect.runSync(
				Hash.keccak256(new Uint8Array([1, 2, 3, 4, 5])),
			);
			expect(BaseHash.equals(hexHash, bytesHash)).toBe(true);
		});

		it("hashes empty hex", () => {
			const hash = Effect.runSync(Hash.keccak256Hex("0x"));
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});
	});

	describe("keccak256String", () => {
		it("hashes UTF-8 string", () => {
			const hash = Effect.runSync(Hash.keccak256String("hello"));
			expect(hash.length).toBe(32);
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			);
		});

		it("hashes empty string", () => {
			const hash = Effect.runSync(Hash.keccak256String(""));
			const hex = S.encodeSync(Hash.Hex)(hash);
			expect(hex).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it("handles unicode", () => {
			const hash = Effect.runSync(Hash.keccak256String("🚀"));
			expect(hash.length).toBe(32);
		});

		it("produces deterministic output", () => {
			const hash1 = Effect.runSync(Hash.keccak256String("test"));
			const hash2 = Effect.runSync(Hash.keccak256String("test"));
			expect(BaseHash.equals(hash1, hash2)).toBe(true);
		});
	});
});

describe("merkleRoot", () => {
	it("computes root for single leaf", () => {
		const leaf = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
		const root = Effect.runSync(Hash.merkleRoot([leaf]));
		expect(root.length).toBe(32);
	});

	it("computes root for two leaves", () => {
		const leaf1 = S.decodeSync(Hash.Hex)("0x" + "aa".repeat(32));
		const leaf2 = S.decodeSync(Hash.Hex)("0x" + "bb".repeat(32));
		const root = Effect.runSync(Hash.merkleRoot([leaf1, leaf2]));
		expect(root.length).toBe(32);
	});

	it("computes root for power-of-two leaves", () => {
		const leaves = [
			S.decodeSync(Hash.Hex)("0x" + "11".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "22".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "33".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "44".repeat(32)),
		];
		const root = Effect.runSync(Hash.merkleRoot(leaves));
		expect(root.length).toBe(32);
	});

	it("computes root for non-power-of-two leaves", () => {
		const leaves = [
			S.decodeSync(Hash.Hex)("0x" + "11".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "22".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "33".repeat(32)),
		];
		const root = Effect.runSync(Hash.merkleRoot(leaves));
		expect(root.length).toBe(32);
	});

	it("produces deterministic output", () => {
		const leaves = [
			S.decodeSync(Hash.Hex)("0x" + "aa".repeat(32)),
			S.decodeSync(Hash.Hex)("0x" + "bb".repeat(32)),
		];
		const root1 = Effect.runSync(Hash.merkleRoot(leaves));
		const root2 = Effect.runSync(Hash.merkleRoot(leaves));
		expect(BaseHash.equals(root1, root2)).toBe(true);
	});

	it("different leaf order produces different root", () => {
		const leaf1 = S.decodeSync(Hash.Hex)("0x" + "aa".repeat(32));
		const leaf2 = S.decodeSync(Hash.Hex)("0x" + "bb".repeat(32));
		const root1 = Effect.runSync(Hash.merkleRoot([leaf1, leaf2]));
		const root2 = Effect.runSync(Hash.merkleRoot([leaf2, leaf1]));
		expect(BaseHash.equals(root1, root2)).toBe(false);
	});
});

describe("random", () => {
	it("generates 32-byte hash", async () => {
		const hash = await Effect.runPromise(Hash.random());
		expect(hash.length).toBe(32);
	});

	it("generates different hashes on each call", async () => {
		const hash1 = await Effect.runPromise(Hash.random());
		const hash2 = await Effect.runPromise(Hash.random());
		expect(BaseHash.equals(hash1, hash2)).toBe(false);
	});

	it("generates valid hash format", async () => {
		const hash = await Effect.runPromise(Hash.random());
		const hex = S.encodeSync(Hash.Hex)(hash);
		expect(hex.length).toBe(66);
		expect(hex.startsWith("0x")).toBe(true);
	});
});

describe("edge cases", () => {
	describe("zero hash", () => {
		const zeroHash = S.decodeSync(Hash.Hex)("0x" + "00".repeat(32));

		it("can be created from hex", () => {
			expect(zeroHash.length).toBe(32);
			expect(zeroHash.every((b) => b === 0)).toBe(true);
		});

		it("can be created from bytes", () => {
			const hash = S.decodeSync(Hash.Bytes)(new Uint8Array(32));
			expect(Effect.runSync(Hash.isZero(hash))).toBe(true);
		});

		it("encodes correctly", () => {
			const hex = S.encodeSync(Hash.Hex)(zeroHash);
			expect(hex).toBe("0x" + "00".repeat(32));
		});

		it("equals itself", () => {
			const another = S.decodeSync(Hash.Hex)("0x" + "00".repeat(32));
			expect(BaseHash.equals(zeroHash, another)).toBe(true);
		});
	});

	describe("max value hash", () => {
		const maxHash = S.decodeSync(Hash.Hex)("0x" + "ff".repeat(32));

		it("can be created", () => {
			expect(maxHash.length).toBe(32);
			expect(maxHash.every((b) => b === 0xff)).toBe(true);
		});

		it("is not zero", () => {
			expect(Effect.runSync(Hash.isZero(maxHash))).toBe(false);
		});
	});

	describe("format", () => {
		it("formats hash for display", async () => {
			const hash = S.decodeSync(Hash.Hex)(
				"0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
			);
			const formatted = await Effect.runPromise(Hash.format(hash));
			expect(typeof formatted).toBe("string");
		});
	});

	describe("assert", () => {
		it("does not throw for valid hash", () => {
			const hash = S.decodeSync(Hash.Hex)("0x" + "ab".repeat(32));
			expect(() => Effect.runSync(Hash.assert(hash))).not.toThrow();
		});
	});
});
