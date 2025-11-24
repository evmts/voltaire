/**
 * Tests for Opcode.disassemble
 */

import { describe, expect, it } from "vitest";
import * as Opcode from "./Opcode.js";
import { disassemble } from "./disassemble.js";

describe("Opcode.disassemble", () => {
	it("disassembles empty bytecode", () => {
		const bytecode = new Uint8Array([]);
		const result = disassemble(bytecode);
		expect(result).toEqual([]);
	});

	it("disassembles single opcode", () => {
		const bytecode = new Uint8Array([Opcode.STOP]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe("0x0000: STOP");
	});

	it("disassembles arithmetic opcodes", () => {
		const bytecode = new Uint8Array([Opcode.ADD, Opcode.MUL, Opcode.SUB]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: ADD");
		expect(result[1]).toBe("0x0001: MUL");
		expect(result[2]).toBe("0x0002: SUB");
	});

	it("disassembles PUSH1 with immediate", () => {
		const bytecode = new Uint8Array([Opcode.PUSH1, 0x42]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe("0x0000: PUSH1 0x42");
	});

	it("disassembles PUSH2 with immediate", () => {
		const bytecode = new Uint8Array([Opcode.PUSH2, 0x12, 0x34]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe("0x0000: PUSH2 0x1234");
	});

	it("disassembles PUSH32 with full immediate", () => {
		const immediate = Array(32).fill(0xff);
		const bytecode = new Uint8Array([Opcode.PUSH32, ...immediate]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(`0x0000: PUSH32 0x${"ff".repeat(32)}`);
	});

	it("disassembles PUSH0", () => {
		const bytecode = new Uint8Array([Opcode.PUSH0]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(1);
		expect(result[0]).toBe("0x0000: PUSH0");
	});

	it("disassembles mixed opcodes with PUSH", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0x01,
			Opcode.PUSH1,
			0x02,
			Opcode.ADD,
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: PUSH1 0x01");
		expect(result[1]).toBe("0x0002: PUSH1 0x02");
		expect(result[2]).toBe("0x0004: ADD");
	});

	it("disassembles DUP opcodes", () => {
		const bytecode = new Uint8Array([Opcode.DUP1, Opcode.DUP2, Opcode.DUP16]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: DUP1");
		expect(result[1]).toBe("0x0001: DUP2");
		expect(result[2]).toBe("0x0002: DUP16");
	});

	it("disassembles SWAP opcodes", () => {
		const bytecode = new Uint8Array([
			Opcode.SWAP1,
			Opcode.SWAP8,
			Opcode.SWAP16,
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: SWAP1");
		expect(result[1]).toBe("0x0001: SWAP8");
		expect(result[2]).toBe("0x0002: SWAP16");
	});

	it("disassembles LOG opcodes", () => {
		const bytecode = new Uint8Array([Opcode.LOG0, Opcode.LOG2, Opcode.LOG4]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: LOG0");
		expect(result[1]).toBe("0x0001: LOG2");
		expect(result[2]).toBe("0x0002: LOG4");
	});

	it("disassembles jump instructions", () => {
		const bytecode = new Uint8Array([
			Opcode.JUMP,
			Opcode.JUMPI,
			Opcode.JUMPDEST,
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: JUMP");
		expect(result[1]).toBe("0x0001: JUMPI");
		expect(result[2]).toBe("0x0002: JUMPDEST");
	});

	it("disassembles system opcodes", () => {
		const bytecode = new Uint8Array([
			Opcode.CREATE,
			Opcode.CALL,
			Opcode.RETURN,
			Opcode.REVERT,
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(4);
		expect(result[0]).toBe("0x0000: CREATE");
		expect(result[1]).toBe("0x0001: CALL");
		expect(result[2]).toBe("0x0002: RETURN");
		expect(result[3]).toBe("0x0003: REVERT");
	});

	it("disassembles complete example program", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0x01,
			Opcode.PUSH1,
			0x02,
			Opcode.ADD,
			Opcode.PUSH1,
			0x00,
			Opcode.MSTORE,
			Opcode.PUSH1,
			0x20,
			Opcode.PUSH1,
			0x00,
			Opcode.RETURN,
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(8);
		expect(result[0]).toBe("0x0000: PUSH1 0x01");
		expect(result[7]).toBe("0x000c: RETURN");
	});

	it("handles invalid opcodes gracefully", () => {
		const bytecode = new Uint8Array([0x0c, Opcode.ADD, 0x0d]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(3);
		expect(result[0]).toBe("0x0000: UNKNOWN");
		expect(result[1]).toBe("0x0001: ADD");
		expect(result[2]).toBe("0x0002: UNKNOWN");
	});

	it("tracks correct offsets with varied instruction sizes", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0xff,
			Opcode.PUSH4,
			0x11,
			0x22,
			0x33,
			0x44,
			Opcode.ADD,
			Opcode.PUSH32,
			...Array(32).fill(0xaa),
		]);
		const result = disassemble(bytecode);
		expect(result).toHaveLength(4);
		expect(result[0]).toContain("0x0000:");
		expect(result[1]).toContain("0x0002:");
		expect(result[2]).toContain("0x0007:");
		expect(result[3]).toContain("0x0008:");
	});
});
