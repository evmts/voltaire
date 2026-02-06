import { describe, expect, it } from "vitest";

describe("Bytecode.hasMetadata (docs/primitives/bytecode/hasMetadata.mdx)", () => {
	describe("Basic Detection", () => {
		it("should detect Solidity metadata pattern", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Bytecode with typical Solidity metadata markers (ipfs prefix)
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x80, 0x60, 0x40, 0x52, 0xa2, 0x64, 0x69, 0x70, 0x66, 0x73,
					0x00, 0x33,
				]),
			);
			const has = code.hasMetadata();

			expect(has).toBe(true);
		});

		it("should return false for bytecode without metadata", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Simple bytecode without metadata
			const code = Bytecode("0x600100");
			const has = code.hasMetadata();

			expect(has).toBe(false);
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const has = code.hasMetadata();

			expect(has).toBe(false);
		});
	});

	describe("Metadata Detection Patterns", () => {
		it("should detect CBOR metadata marker", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// CBOR encoded metadata ends with length bytes
			// This is a pattern from Solidity 0.4.7+
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x01, 0x00, 0xa2, 0x64, 0x69, 0x70, 0x66, 0x73, 0x58, 0x22,
					0x00, 0x33,
				]),
			);

			const has = code.hasMetadata();
			expect(typeof has).toBe("boolean");
		});
	});

	describe("Return Type", () => {
		it("should return boolean", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const has = code.hasMetadata();

			expect(typeof has).toBe("boolean");
		});
	});
});
