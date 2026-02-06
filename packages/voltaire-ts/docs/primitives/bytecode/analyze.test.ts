import { describe, expect, it } from "vitest";

describe("Bytecode.analyze (docs/primitives/bytecode/analyze.mdx)", () => {
	describe("Basic Analysis", () => {
		it("should analyze valid bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01, PUSH1 0x02, ADD
			const code = Bytecode("0x6001600201");
			const analysis = code.analyze();

			expect(analysis.valid).toBe(true);
			expect(analysis.instructions.length).toBe(3);
			expect(analysis.jumpDestinations).toBeInstanceOf(Set);
		});

		it("should detect invalid bytecode (truncated PUSH)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 with no data
			const code = Bytecode("0x60");
			const analysis = code.analyze();

			expect(analysis.valid).toBe(false);
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const analysis = code.analyze();

			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(0);
			expect(analysis.jumpDestinations.size).toBe(0);
		});
	});

	describe("Jump Destination Detection", () => {
		it("should find JUMPDEST opcodes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// JUMPDEST, PUSH1 0x01, JUMPDEST, STOP
			const code = Bytecode("0x5b60015b00");
			const analysis = code.analyze();

			expect(analysis.jumpDestinations.has(0)).toBe(true); // First JUMPDEST at position 0
			expect(analysis.jumpDestinations.has(3)).toBe(true); // Second JUMPDEST at position 3
		});

		it("should not mark JUMPDEST bytes inside PUSH data", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH2 0x5b00 - the 0x5b is data, not a JUMPDEST
			const code = Bytecode("0x615b00");
			const analysis = code.analyze();

			// Position 1 is inside PUSH2 data, should not be a jump destination
			expect(analysis.jumpDestinations.has(1)).toBe(false);
		});
	});

	describe("Instruction Parsing", () => {
		it("should parse PUSH data correctly", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01, PUSH2 0x0203, ADD
			const code = Bytecode("0x6001610203" + "01");
			const analysis = code.analyze();

			expect(analysis.instructions[0].opcode).toBe(0x60); // PUSH1
			expect(analysis.instructions[0].pushData).toEqual(new Uint8Array([0x01]));
			expect(analysis.instructions[1].opcode).toBe(0x61); // PUSH2
			expect(analysis.instructions[1].pushData).toEqual(
				new Uint8Array([0x02, 0x03]),
			);
		});

		it("should track instruction positions", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01 (2 bytes), PUSH1 0x02 (2 bytes), ADD (1 byte)
			const code = Bytecode("0x6001600201");
			const analysis = code.analyze();

			expect(analysis.instructions[0].position).toBe(0);
			expect(analysis.instructions[1].position).toBe(2);
			expect(analysis.instructions[2].position).toBe(4);
		});
	});

	describe("Analysis Return Type", () => {
		it("should return Analysis type structure", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const analysis = code.analyze();

			// Type shape from docs
			expect(typeof analysis.valid).toBe("boolean");
			expect(analysis.jumpDestinations).toBeInstanceOf(Set);
			expect(Array.isArray(analysis.instructions)).toBe(true);

			// Each instruction should have required fields
			for (const inst of analysis.instructions) {
				expect(typeof inst.opcode).toBe("number");
				expect(typeof inst.position).toBe("number");
			}
		});
	});
});
