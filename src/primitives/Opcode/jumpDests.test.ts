/**
 * Tests for Opcode.jumpDests
 */

import { describe, expect, it } from "vitest";
import * as Opcode from "./Opcode.js";
import { jumpDests } from "./jumpDests.js";

describe("Opcode.jumpDests", () => {
	it("returns empty set for empty bytecode", () => {
		const bytecode = new Uint8Array([]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(0);
	});

	it("returns empty set when no JUMPDEST present", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0x01,
			Opcode.PUSH1,
			0x02,
			Opcode.ADD,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(0);
	});

	it("finds single JUMPDEST", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0x03,
			Opcode.JUMPDEST,
			Opcode.ADD,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(2)).toBe(true);
	});

	it("finds multiple JUMPDESTs", () => {
		const bytecode = new Uint8Array([
			Opcode.JUMPDEST,
			Opcode.PUSH1,
			0x05,
			Opcode.JUMPDEST,
			Opcode.ADD,
			Opcode.JUMPDEST,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(3);
		expect(result.has(0)).toBe(true);
		expect(result.has(3)).toBe(true);
		expect(result.has(5)).toBe(true);
	});

	it("does not include JUMPDEST in PUSH immediate", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			Opcode.JUMPDEST,
			Opcode.JUMPDEST,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(2)).toBe(true);
		expect(result.has(1)).toBe(false);
	});

	it("handles PUSH32 with JUMPDEST in immediate", () => {
		const immediate = Array(32).fill(Opcode.JUMPDEST);
		const bytecode = new Uint8Array([
			Opcode.PUSH32,
			...immediate,
			Opcode.JUMPDEST,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(33)).toBe(true);
	});

	it("tracks correct positions after various PUSH sizes", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH1,
			0x00,
			Opcode.JUMPDEST,
			Opcode.PUSH2,
			0x00,
			0x00,
			Opcode.JUMPDEST,
			Opcode.PUSH4,
			0x00,
			0x00,
			0x00,
			0x00,
			Opcode.JUMPDEST,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(3);
		expect(result.has(2)).toBe(true);
		expect(result.has(6)).toBe(true);
		expect(result.has(12)).toBe(true);
	});

	it("handles complex bytecode with multiple instruction types", () => {
		const bytecode = new Uint8Array([
			Opcode.JUMPDEST,
			Opcode.PUSH1,
			0x04,
			Opcode.JUMP,
			Opcode.JUMPDEST,
			Opcode.ADD,
			Opcode.JUMPDEST,
			Opcode.RETURN,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(3);
		expect(result.has(0)).toBe(true);
		expect(result.has(4)).toBe(true);
		expect(result.has(6)).toBe(true);
	});

	it("handles PUSH0", () => {
		const bytecode = new Uint8Array([
			Opcode.PUSH0,
			Opcode.JUMPDEST,
			Opcode.PUSH0,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(1)).toBe(true);
	});

	it("ignores invalid opcodes", () => {
		const bytecode = new Uint8Array([
			0x0c,
			Opcode.JUMPDEST,
			0x0d,
			Opcode.JUMPDEST,
		]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(2);
		expect(result.has(1)).toBe(true);
		expect(result.has(3)).toBe(true);
	});

	it("handles bytecode ending with JUMPDEST", () => {
		const bytecode = new Uint8Array([Opcode.ADD, Opcode.JUMPDEST]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(1)).toBe(true);
	});

	it("handles bytecode starting with JUMPDEST", () => {
		const bytecode = new Uint8Array([Opcode.JUMPDEST, Opcode.ADD]);
		const result = jumpDests(bytecode);
		expect(result.size).toBe(1);
		expect(result.has(0)).toBe(true);
	});
});
