import { describe, expect, it } from "vitest";

describe("Bytecode.formatInstruction (docs/primitives/bytecode/formatInstruction.mdx)", () => {
	describe("Basic Formatting", () => {
		it("should format a single instruction", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001");
			const instructions = code.parseInstructions();
			const formatted = Bytecode.formatInstruction(instructions[0]);

			expect(typeof formatted).toBe("string");
			expect(formatted.length).toBeGreaterThan(0);
		});

		it("should format PUSH instruction with data", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x60ff");
			const instructions = code.parseInstructions();
			const formatted = Bytecode.formatInstruction(instructions[0]);

			expect(formatted).toContain("PUSH1");
		});

		it("should format non-PUSH instruction", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x01"); // ADD
			const instructions = code.parseInstructions();
			const formatted = Bytecode.formatInstruction(instructions[0]);

			expect(typeof formatted).toBe("string");
		});
	});

	describe("Various Opcodes", () => {
		it("should format various opcode types", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const opcodes = [
				0x00, // STOP
				0x01, // ADD
				0x20, // KECCAK256
				0x51, // MLOAD
				0x54, // SLOAD
				0xf3, // RETURN
			];

			for (const opcode of opcodes) {
				const code = Bytecode(new Uint8Array([opcode]));
				const instructions = code.parseInstructions();
				const formatted = Bytecode.formatInstruction(instructions[0]);

				expect(typeof formatted).toBe("string");
				expect(formatted.length).toBeGreaterThan(0);
			}
		});
	});
});
