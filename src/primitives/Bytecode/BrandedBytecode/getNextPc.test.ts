import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { getNextPc as _getNextPc } from "./getNextPc.js";

describe("getNextPc", () => {
	it("should return PC + 1 for regular opcode (ADD)", () => {
		// ADD opcode at position 0
		const bytecode = from(new Uint8Array([0x01, 0x00, 0x00]));
		expect(_getNextPc(bytecode, 0)).toBe(1);
	});

	it("should return PC + 2 for PUSH1", () => {
		// PUSH1 0x42 at position 0
		const bytecode = from(new Uint8Array([0x60, 0x42, 0x00]));
		expect(_getNextPc(bytecode, 0)).toBe(2);
	});

	it("should return PC + 3 for PUSH2", () => {
		// PUSH2 0x1234 at position 0
		const bytecode = from(new Uint8Array([0x61, 0x12, 0x34, 0x00]));
		expect(_getNextPc(bytecode, 0)).toBe(3);
	});

	it("should return PC + 33 for PUSH32", () => {
		// PUSH32 with 32 bytes of data
		const bytecode = from(
			new Uint8Array([
				0x7f, // PUSH32
				...Array(32).fill(0xff),
				0x00, // Next instruction
			]),
		);
		expect(_getNextPc(bytecode, 0)).toBe(33);
	});

	it("should handle multiple instructions", () => {
		// ADD at 0, PUSH1 at 1, MUL at 3
		const bytecode = from(new Uint8Array([0x01, 0x60, 0x42, 0x02]));
		expect(_getNextPc(bytecode, 0)).toBe(1); // ADD -> PC 1
		expect(_getNextPc(bytecode, 1)).toBe(3); // PUSH1 -> PC 3
		expect(_getNextPc(bytecode, 3)).toBeUndefined(); // MUL at last byte -> EOF
	});

	it("should return undefined when next PC would exceed bytecode length", () => {
		// Single opcode
		const bytecode = from(new Uint8Array([0x00]));
		expect(_getNextPc(bytecode, 0)).toBeUndefined();
	});

	it("should return undefined when current PC is at last byte", () => {
		const bytecode = from(new Uint8Array([0x01, 0x02, 0x03]));
		expect(_getNextPc(bytecode, 2)).toBeUndefined();
	});

	it("should return undefined when PUSH extends beyond bytecode", () => {
		// PUSH32 without enough data
		const bytecode = from(new Uint8Array([0x7f, 0x01, 0x02]));
		expect(_getNextPc(bytecode, 0)).toBeUndefined();
	});

	it("should return undefined for invalid PC (out of bounds)", () => {
		const bytecode = from(new Uint8Array([0x01, 0x02]));
		expect(_getNextPc(bytecode, 5)).toBeUndefined();
	});

	it("should return undefined for negative PC", () => {
		const bytecode = from(new Uint8Array([0x01, 0x02]));
		expect(_getNextPc(bytecode, -1)).toBeUndefined();
	});

	it("should handle PUSH at middle of bytecode", () => {
		// Some ops, then PUSH1, then more ops
		const bytecode = from(
			new Uint8Array([
				0x00, // STOP
				0x01, // ADD
				0x60,
				0x42, // PUSH1 0x42
				0x02, // MUL
			]),
		);
		expect(_getNextPc(bytecode, 2)).toBe(4); // PUSH1 at PC 2 -> PC 4
	});

	it("should handle all PUSH variants correctly", () => {
		// Test PUSH1, PUSH10, PUSH20, PUSH32
		const push1 = from(new Uint8Array([0x60, ...Array(1).fill(0), 0x00]));
		const push10 = from(new Uint8Array([0x69, ...Array(10).fill(0), 0x00]));
		const push20 = from(new Uint8Array([0x73, ...Array(20).fill(0), 0x00]));
		const push32 = from(new Uint8Array([0x7f, ...Array(32).fill(0), 0x00]));

		expect(_getNextPc(push1, 0)).toBe(2); // 1 + 1
		expect(_getNextPc(push10, 0)).toBe(11); // 1 + 10
		expect(_getNextPc(push20, 0)).toBe(21); // 1 + 20
		expect(_getNextPc(push32, 0)).toBe(33); // 1 + 32
	});

	it("should handle empty bytecode", () => {
		const bytecode = from(new Uint8Array([]));
		expect(_getNextPc(bytecode, 0)).toBeUndefined();
	});

	it("should handle zero opcode (STOP)", () => {
		const bytecode = from(new Uint8Array([0x00, 0x00]));
		expect(_getNextPc(bytecode, 0)).toBe(1);
	});
});
