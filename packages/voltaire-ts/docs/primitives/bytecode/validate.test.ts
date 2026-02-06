import { describe, expect, it } from "vitest";

describe("Bytecode.validate (docs/primitives/bytecode/validate.mdx)", () => {
	describe("Valid Bytecode", () => {
		it("should validate correct bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const isValid = code.validate();

			expect(isValid).toBe(true);
		});

		it("should validate empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const isValid = code.validate();

			expect(isValid).toBe(true);
		});

		it("should validate single STOP", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x00"); // STOP
			const isValid = code.validate();

			expect(isValid).toBe(true);
		});
	});

	describe("Invalid Bytecode", () => {
		it("should detect truncated PUSH1", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x60"); // PUSH1 with no data
			const isValid = code.validate();

			expect(isValid).toBe(false);
		});

		it("should detect truncated PUSH2", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6101"); // PUSH2 with only 1 byte
			const isValid = code.validate();

			expect(isValid).toBe(false);
		});

		it("should detect truncated PUSH32", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH32 with only 10 bytes of data
			const code = Bytecode("0x7f" + "01".repeat(10));
			const isValid = code.validate();

			expect(isValid).toBe(false);
		});
	});

	describe("Bytecode with Jumps", () => {
		it("should validate bytecode with valid structure", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x03, JUMP, STOP, JUMPDEST (structurally valid)
			const code = Bytecode("0x60035600" + "5b");
			const isValid = code.validate();

			// Structural validation (not runtime jump target validation)
			expect(isValid).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("should handle INVALID opcode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// INVALID opcode (0xfe) is structurally valid
			const code = Bytecode("0xfe");
			const isValid = code.validate();

			expect(isValid).toBe(true);
		});

		it("should handle unknown opcodes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Undefined opcodes are structurally valid (treated as 1-byte)
			const code = Bytecode("0x0c0d0e");
			const isValid = code.validate();

			expect(isValid).toBe(true);
		});
	});
});
