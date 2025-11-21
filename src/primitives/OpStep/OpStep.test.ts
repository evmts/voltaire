import { describe, expect, it } from "vitest";
import * as OpStep from "./index.js";

describe("OpStep", () => {
	it("creates basic OpStep", () => {
		const step = OpStep.from({
			pc: 0,
			op: 0x60 as any, // PUSH1
			gas: 1000000n as any,
			gasCost: 3n as any,
			depth: 0,
		});
		expect(step.pc).toBe(0);
		expect(step.op).toBe(0x60);
		expect(step.gas).toBe(1000000n);
		expect(step.gasCost).toBe(3n);
		expect(step.depth).toBe(0);
	});

	it("creates OpStep with stack", () => {
		const step = OpStep.from({
			pc: 2,
			op: 0x01 as any, // ADD
			gas: 999997n as any,
			gasCost: 3n as any,
			depth: 0,
			stack: [5n as any, 10n as any],
		});
		expect(step.stack).toEqual([5n, 10n]);
	});

	it("creates OpStep with memory", () => {
		const memory = new Uint8Array([0x60, 0x40]);
		const step = OpStep.from({
			pc: 10,
			op: 0x52 as any, // MSTORE
			gas: 999900n as any,
			gasCost: 6n as any,
			depth: 0,
			memory,
		});
		expect(step.memory).toBe(memory);
	});

	it("creates OpStep with storage", () => {
		const step = OpStep.from({
			pc: 20,
			op: 0x55 as any, // SSTORE
			gas: 980000n as any,
			gasCost: 20000n as any,
			depth: 0,
			storage: { "0x01": 100n as any },
		});
		expect(step.storage?.["0x01"]).toBe(100n);
	});

	it("creates OpStep with error", () => {
		const step = OpStep.from({
			pc: 100,
			op: 0xfd as any, // REVERT
			gas: 50000n as any,
			gasCost: 0n as any,
			depth: 0,
			error: "execution reverted",
		});
		expect(step.error).toBe("execution reverted");
		expect(OpStep.hasError(step)).toBe(true);
	});

	it("hasError returns false for no error", () => {
		const step = OpStep.from({
			pc: 0,
			op: 0x60 as any,
			gas: 1000000n as any,
			gasCost: 3n as any,
			depth: 0,
		});
		expect(OpStep.hasError(step)).toBe(false);
	});
});
