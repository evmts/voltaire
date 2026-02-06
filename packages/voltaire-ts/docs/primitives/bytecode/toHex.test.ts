import { describe, expect, it } from "vitest";

describe("Bytecode.toHex (docs/primitives/bytecode/toHex.mdx)", () => {
	describe("Basic Usage", () => {
		it("should convert bytecode to hex string", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const hex = code.toHex();

			expect(typeof hex).toBe("string");
			expect(hex).toBe("0x600100");
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode(new Uint8Array([]));
			const hex = code.toHex();

			expect(hex).toBe("0x");
		});

		it("should produce lowercase hex", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode(new Uint8Array([0xab, 0xcd, 0xef]));
			const hex = code.toHex();

			expect(hex).toBe("0xabcdef");
		});

		it("should round-trip with fromHex", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const original = "0x6080604052600436";
			const code = Bytecode.fromHex(original);
			const hex = code.toHex();

			expect(hex).toBe(original);
		});
	});

	describe("Real Bytecode", () => {
		it("should convert complex bytecode to hex", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x80, PUSH1 0x40, MSTORE, PUSH1 0x04, CALLDATASIZE, LT
			const bytes = new Uint8Array([
				0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x04, 0x36, 0x10,
			]);
			const code = Bytecode(bytes);
			const hex = code.toHex();

			expect(hex).toBe("0x608060405260043610");
		});
	});
});
