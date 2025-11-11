import { describe, expect, it } from "vitest";
import type { BrandedBytecode } from "./BrandedBytecode.js";
import { scan } from "./scan.js";

// Helper to brand Uint8Array as BrandedBytecode for tests
const bc = (arr: Uint8Array): BrandedBytecode => arr as BrandedBytecode;

describe("Bytecode.scan", () => {
	// ========================================================================
	// Basic Iteration Tests
	// ========================================================================

	it("scans single instruction", () => {
		const code = bc(new Uint8Array([0x00])); // STOP
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x00,
			type: "regular",
			size: 1,
		});
	});

	it("scans multiple regular instructions", () => {
		const code = bc(new Uint8Array([0x01, 0x02, 0x00])); // ADD, MUL, STOP
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(3);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x01,
			type: "regular",
			size: 1,
		});
		expect(instructions[1]).toMatchObject({
			pc: 1,
			opcode: 0x02,
			type: "regular",
			size: 1,
		});
		expect(instructions[2]).toMatchObject({
			pc: 2,
			opcode: 0x00,
			type: "regular",
			size: 1,
		});
	});

	it("handles empty bytecode", () => {
		const code = bc(new Uint8Array([]));
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(0);
	});

	// ========================================================================
	// PUSH Data Handling Tests
	// ========================================================================

	it("scans PUSH1 instruction with data", () => {
		const code = bc(new Uint8Array([0x60, 0x42])); // PUSH1 0x42
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x60,
			type: "push",
			size: 2,
			value: 0x42n,
		});
	});

	it("scans PUSH2 instruction with data", () => {
		const code = bc(new Uint8Array([0x61, 0x01, 0x23])); // PUSH2 0x0123
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x61,
			type: "push",
			size: 3,
			value: 0x0123n,
		});
	});

	it("scans PUSH32 instruction with data", () => {
		const data = new Array(32).fill(0xff);
		const code = bc(new Uint8Array([0x7f, ...data])); // PUSH32
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x7f,
			type: "push",
			size: 33,
		});
		expect(instructions[0]?.value).toBe(BigInt(`0x${"ff".repeat(32)}`));
	});

	it("correctly skips PUSH data bytes", () => {
		// PUSH1 0x01, PUSH1 0x02, ADD
		const code = bc(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(3);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x60,
			type: "push",
			size: 2,
			value: 0x01n,
		});
		expect(instructions[1]).toMatchObject({
			pc: 2,
			opcode: 0x60,
			type: "push",
			size: 2,
			value: 0x02n,
		});
		expect(instructions[2]).toMatchObject({
			pc: 4,
			opcode: 0x01,
			type: "regular",
			size: 1,
		});
	});

	it("handles incomplete PUSH data", () => {
		const code = bc(new Uint8Array([0x60])); // PUSH1 with no data
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x60,
			type: "push",
			size: 1,
			value: 0n,
		});
	});

	it("handles PUSH32 with incomplete data", () => {
		const code = bc(new Uint8Array([0x7f, 0x01, 0x02])); // PUSH32 with only 2 bytes
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x7f,
			type: "push",
			size: 3,
			value: 0x0102n,
		});
	});

	// ========================================================================
	// Options: withGas
	// ========================================================================

	it("includes gas costs when withGas is true", () => {
		const code = bc(new Uint8Array([0x01, 0x60, 0x00])); // ADD, PUSH1 0x00
		const instructions = Array.from(scan(code, { withGas: true }));

		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toHaveProperty("gas");
		expect(instructions[0]?.gas).toBe(3); // ADD costs 3 gas
		expect(instructions[1]).toHaveProperty("gas");
		expect(instructions[1]?.gas).toBe(3); // PUSH1 costs 3 gas
	});

	it("excludes gas costs when withGas is false", () => {
		const code = bc(new Uint8Array([0x01])); // ADD
		const instructions = Array.from(scan(code, { withGas: false }));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).not.toHaveProperty("gas");
	});

	it("defaults to no gas costs", () => {
		const code = bc(new Uint8Array([0x01])); // ADD
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).not.toHaveProperty("gas");
	});

	// ========================================================================
	// Options: withStack
	// ========================================================================

	it("includes stack effects when withStack is true", () => {
		const code = bc(new Uint8Array([0x01, 0x50])); // ADD, POP
		const instructions = Array.from(scan(code, { withStack: true }));

		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toHaveProperty("stackEffect");
		expect(instructions[0]?.stackEffect).toMatchObject({ pop: 2, push: 1 }); // ADD
		expect(instructions[1]).toHaveProperty("stackEffect");
		expect(instructions[1]?.stackEffect).toMatchObject({ pop: 1, push: 0 }); // POP
	});

	it("excludes stack effects when withStack is false", () => {
		const code = bc(new Uint8Array([0x01])); // ADD
		const instructions = Array.from(scan(code, { withStack: false }));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).not.toHaveProperty("stackEffect");
	});

	it("defaults to no stack effects", () => {
		const code = bc(new Uint8Array([0x01])); // ADD
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).not.toHaveProperty("stackEffect");
	});

	// ========================================================================
	// Options: startPc and endPc
	// ========================================================================

	it("respects startPc option", () => {
		// PUSH1 0x00, PUSH1 0x01, ADD, STOP
		const code = bc(new Uint8Array([0x60, 0x00, 0x60, 0x01, 0x01, 0x00]));
		const instructions = Array.from(scan(code, { startPc: 2 }));

		expect(instructions).toHaveLength(3);
		expect(instructions[0]).toMatchObject({ pc: 2, opcode: 0x60 });
		expect(instructions[1]).toMatchObject({ pc: 4, opcode: 0x01 });
		expect(instructions[2]).toMatchObject({ pc: 5, opcode: 0x00 });
	});

	it("respects endPc option", () => {
		// PUSH1 0x00, PUSH1 0x01, ADD, STOP
		const code = bc(new Uint8Array([0x60, 0x00, 0x60, 0x01, 0x01, 0x00]));
		const instructions = Array.from(scan(code, { endPc: 4 }));

		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toMatchObject({ pc: 0, opcode: 0x60 });
		expect(instructions[1]).toMatchObject({ pc: 2, opcode: 0x60 });
	});

	it("respects both startPc and endPc", () => {
		// PUSH1 0x00, PUSH1 0x01, ADD, STOP
		const code = bc(new Uint8Array([0x60, 0x00, 0x60, 0x01, 0x01, 0x00]));
		const instructions = Array.from(scan(code, { startPc: 2, endPc: 5 }));

		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toMatchObject({ pc: 2, opcode: 0x60 });
		expect(instructions[1]).toMatchObject({ pc: 4, opcode: 0x01 });
	});

	it("returns empty when startPc >= endPc", () => {
		const code = bc(new Uint8Array([0x60, 0x00, 0x01]));
		const instructions = Array.from(scan(code, { startPc: 2, endPc: 2 }));

		expect(instructions).toHaveLength(0);
	});

	it("handles startPc beyond bytecode length", () => {
		const code = bc(new Uint8Array([0x60, 0x00]));
		const instructions = Array.from(scan(code, { startPc: 10 }));

		expect(instructions).toHaveLength(0);
	});

	// ========================================================================
	// Combined Options Tests
	// ========================================================================

	it("combines withGas and withStack options", () => {
		const code = bc(new Uint8Array([0x01])); // ADD
		const instructions = Array.from(
			scan(code, { withGas: true, withStack: true }),
		);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]).toHaveProperty("gas", 3);
		expect(instructions[0]).toHaveProperty("stackEffect");
		expect(instructions[0]?.stackEffect).toMatchObject({ pop: 2, push: 1 });
	});

	it("combines all options", () => {
		const code = bc(new Uint8Array([0x60, 0x00, 0x01, 0x00])); // PUSH1, ADD, STOP
		const instructions = Array.from(
			scan(code, {
				withGas: true,
				withStack: true,
				startPc: 0,
				endPc: 3,
			}),
		);

		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			opcode: 0x60,
			type: "push",
			gas: 3,
		});
		expect(instructions[1]).toMatchObject({
			pc: 2,
			opcode: 0x01,
			type: "regular",
			gas: 3,
		});
	});

	// ========================================================================
	// Real-World Scenarios
	// ========================================================================

	it("scans realistic bytecode with mixed instructions", () => {
		// PUSH1 0x80, PUSH1 0x40, MSTORE, STOP
		const code = bc(new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52, 0x00]));
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(4);
		expect(instructions[0]).toMatchObject({
			pc: 0,
			type: "push",
			value: 0x80n,
		});
		expect(instructions[1]).toMatchObject({
			pc: 2,
			type: "push",
			value: 0x40n,
		});
		expect(instructions[2]).toMatchObject({
			pc: 4,
			type: "regular",
			opcode: 0x52,
		});
		expect(instructions[3]).toMatchObject({
			pc: 5,
			type: "regular",
			opcode: 0x00,
		});
	});

	it("scans bytecode with JUMPDEST", () => {
		// PUSH1 0x04, JUMP, JUMPDEST, STOP
		const code = bc(new Uint8Array([0x60, 0x04, 0x56, 0x5b, 0x00]));
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(4);
		expect(instructions[2]).toMatchObject({
			pc: 3,
			opcode: 0x5b,
			type: "regular",
		});
	});

	it("works as generator (lazy evaluation)", () => {
		const code = bc(new Uint8Array([0x60, 0x00, 0x60, 0x01, 0x01, 0x00]));
		const gen = scan(code);

		const first = gen.next();
		expect(first.done).toBe(false);
		expect(first.value).toMatchObject({ pc: 0, opcode: 0x60 });

		const second = gen.next();
		expect(second.done).toBe(false);
		expect(second.value).toMatchObject({ pc: 2, opcode: 0x60 });
	});

	it("handles bytecode that ends with PUSH", () => {
		const code = bc(new Uint8Array([0x00, 0x60, 0x42])); // STOP, PUSH1 0x42
		const instructions = Array.from(scan(code));

		expect(instructions).toHaveLength(2);
		expect(instructions[1]).toMatchObject({
			pc: 1,
			type: "push",
			value: 0x42n,
		});
	});
});
