import { describe, expect, it } from "vitest";

describe("Bytecode.hash (docs/primitives/bytecode/hash.mdx)", () => {
	describe("Basic Hashing", () => {
		it("should return keccak256 hash of bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const hash = code.hash();

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("should produce consistent hash", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code1 = Bytecode("0x600100");
			const code2 = Bytecode("0x600100");

			const hash1 = code1.hash();
			const hash2 = code2.hash();

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hash for different bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code1 = Bytecode("0x600100");
			const code2 = Bytecode("0x600200");

			const hash1 = code1.hash();
			const hash2 = code2.hash();

			expect(hash1).not.toEqual(hash2);
		});
	});

	describe("Empty Bytecode", () => {
		it("should hash empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const hash = code.hash();

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});
	});

	describe("Code Hash Usage", () => {
		it("should match keccak256 of raw bytes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);
			const { hash: keccak256 } = await import(
				"../../../src/crypto/Keccak256/hash.js"
			);

			const code = Bytecode("0x6080604052");
			const bytecodeHash = code.hash();
			const directHash = keccak256(new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]));

			expect(bytecodeHash).toEqual(directHash);
		});
	});
});
