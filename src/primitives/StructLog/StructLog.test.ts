import { describe, expect, it } from "vitest";
import * as StructLog from "./index.js";

describe("StructLog", () => {
	it("creates basic StructLog", () => {
		const log = StructLog.from({
			pc: 0,
			op: "PUSH1",
			gas: 1000000n as any,
			gasCost: 3n as any,
			depth: 0,
			stack: ["0x60"],
		});
		expect(log.pc).toBe(0);
		expect(log.op).toBe("PUSH1");
		expect(log.gas).toBe(1000000n);
		expect(log.gasCost).toBe(3n);
		expect(log.depth).toBe(0);
		expect(log.stack).toEqual(["0x60"]);
	});

	it("creates StructLog with memory", () => {
		const log = StructLog.from({
			pc: 10,
			op: "MSTORE",
			gas: 999900n as any,
			gasCost: 6n as any,
			depth: 0,
			stack: ["0x40", "0x60"],
			memory: ["0x6040"],
		});
		expect(log.memory).toEqual(["0x6040"]);
	});

	it("creates StructLog with storage", () => {
		const log = StructLog.from({
			pc: 20,
			op: "SSTORE",
			gas: 980000n as any,
			gasCost: 20000n as any,
			depth: 0,
			stack: ["0x01", "0x64"],
			storage: { "0x01": "0x64" },
		});
		expect(log.storage?.["0x01"]).toBe("0x64");
	});

	it("creates StructLog with refund", () => {
		const log = StructLog.from({
			pc: 30,
			op: "SSTORE",
			gas: 960000n as any,
			gasCost: 5000n as any,
			depth: 0,
			stack: ["0x02", "0x00"],
			refund: 15000n as any,
		});
		expect(log.refund).toBe(15000n);
	});

	it("creates StructLog with error", () => {
		const log = StructLog.from({
			pc: 100,
			op: "REVERT",
			gas: 50000n as any,
			gasCost: 0n as any,
			depth: 0,
			stack: [],
			error: "execution reverted",
		});
		expect(log.error).toBe("execution reverted");
	});

	it("converts StructLog to OpStep", () => {
		const log = StructLog.from({
			pc: 0,
			op: "PUSH1",
			gas: 1000000n as any,
			gasCost: 3n as any,
			depth: 0,
			stack: ["0x60"],
		});
		const step = StructLog.toOpStep(log);
		expect(step.pc).toBe(0);
		expect(step.op).toBe(0x60);
		expect(step.gas).toBe(1000000n);
		expect(step.stack).toEqual([0x60n]);
	});
});
