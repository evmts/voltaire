import { describe, expect, it } from "vitest";

describe("Bytecode.getNextPc (docs/primitives/bytecode/getNextPc.mdx)", () => {
	describe("Basic Usage", () => {
		it("should calculate next PC for regular opcodes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// ADD, MUL, STOP
			const code = Bytecode("0x010200");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBe(1); // Regular opcodes are 1 byte
		});

		it("should calculate next PC for PUSH1", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01, STOP
			const code = Bytecode("0x600100");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBe(2); // PUSH1 = 1 byte opcode + 1 byte data
		});

		it("should calculate next PC for PUSH2", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH2 0x0102, STOP
			const code = Bytecode("0x61010200");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBe(3); // PUSH2 = 1 byte opcode + 2 bytes data
		});

		it("should calculate next PC for PUSH32", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH32 + 32 bytes + ADD
			const code = Bytecode("0x7f" + "ff".repeat(32) + "01");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBe(33); // PUSH32 = 1 byte opcode + 32 bytes data
		});
	});

	describe("Edge Cases", () => {
		it("should return undefined at end of bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// STOP
			const code = Bytecode("0x00");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBeUndefined();
		});

		it("should return undefined for out-of-bounds PC", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const nextPc = code.getNextPc(9999);

			expect(nextPc).toBeUndefined();
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const nextPc = code.getNextPc(0);

			expect(nextPc).toBeUndefined();
		});
	});

	describe("Sequential Iteration", () => {
		it("should allow iterating through bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01 (2), PUSH2 0x0203 (3), STOP (1) = 6 bytes
			const code = Bytecode("0x6001610203" + "00");

			let pc: number | undefined = 0;
			const pcs: number[] = [];

			while (pc !== undefined && pc < code.size()) {
				pcs.push(pc);
				pc = code.getNextPc(pc);
			}

			expect(pcs).toEqual([0, 2, 5]);
		});
	});

	describe("Various Opcodes", () => {
		it("should handle various PUSH sizes", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 at 0 -> next is 2
			// PUSH2 at 2 -> next is 5
			// STOP at 5 -> next is undefined
			const code = Bytecode("0x60016102" + "0300");

			expect(code.getNextPc(0)).toBe(2);
			expect(code.getNextPc(2)).toBe(5);
			expect(code.getNextPc(5)).toBeUndefined();
		});
	});
});
