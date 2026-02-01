import { describe, expect, it } from "vitest";

describe("Bytecode Instruction Types (docs/primitives/bytecode/instruction-types.mdx)", () => {
	describe("Regular Instructions", () => {
		it("should identify regular opcodes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// ADD, MUL, SUB
			const code = Bytecode("0x010203");
			const instructions = Array.from(code.scan());

			expect(instructions.length).toBe(3);
			for (const inst of instructions) {
				expect(typeof inst.opcode).toBe("number");
			}
		});
	});

	describe("PUSH Instructions", () => {
		it("should identify PUSH instructions with value", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x602a"); // PUSH1 42
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0x60);
		});
	});

	describe("JUMPDEST Instructions", () => {
		it("should identify JUMPDEST", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x5b00"); // JUMPDEST, STOP
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0x5b);
		});
	});

	describe("JUMP Instructions", () => {
		it("should identify JUMP", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x56"); // JUMP
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0x56);
		});
	});

	describe("JUMPI Instructions", () => {
		it("should identify JUMPI", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x57"); // JUMPI
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0x57);
		});
	});

	describe("STOP Instructions", () => {
		it("should identify STOP", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x00"); // STOP
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0x00);
		});
	});

	describe("INVALID Instructions", () => {
		it("should identify INVALID", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0xfe"); // INVALID
			const instructions = Array.from(code.scan());

			expect(instructions[0].opcode).toBe(0xfe);
		});
	});

	describe("Instruction Position Tracking", () => {
		it("should track pc for all instructions", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const instructions = Array.from(code.scan());

			// scan() returns pc field
			for (const inst of instructions) {
				expect(typeof inst.pc).toBe("number");
			}
		});
	});
});
