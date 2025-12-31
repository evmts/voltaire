import { describe, expect, it } from "vitest";
import * as CallTrace from "../CallTrace/index.js";
import * as StructLog from "../StructLog/index.js";
import * as TraceResult from "./index.js";

describe("TraceResult", () => {
	it("creates successful TraceResult", () => {
		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array([0x01]),
		});
		expect(result.gas).toBe(50000n);
		expect(result.failed).toBe(false);
		expect(result.returnValue).toEqual(new Uint8Array([0x01]));
	});

	it("creates failed TraceResult", () => {
		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 100000n as any,
			failed: true,
			returnValue: new Uint8Array(),
		});
		expect(result.failed).toBe(true);
	});

	it("creates TraceResult with structLogs", () => {
		const log1 = StructLog.from({
			pc: 0,
			op: "PUSH1",
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 1000000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gasCost: 3n as any,
			depth: 0,
			stack: ["0x60"],
		});
		const log2 = StructLog.from({
			pc: 2,
			op: "PUSH1",
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 999997n as any,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gasCost: 3n as any,
			depth: 0,
			stack: ["0x60", "0x40"],
		});

		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array(),
			structLogs: [log1, log2],
		});
		expect(result.structLogs?.length).toBe(2);
	});

	it("creates TraceResult with callTrace", () => {
		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const fromAddr = new Uint8Array(20).fill(1) as any;
		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const toAddr = new Uint8Array(20).fill(2) as any;

		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gasUsed: 50000n as any,
			input: new Uint8Array(),
			output: new Uint8Array([0x01]),
		});

		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array([0x01]),
			callTrace: trace,
		});
		expect(result.callTrace).toBe(trace);
	});

	it("getStructLogs returns empty array when undefined", () => {
		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array(),
		});
		expect(TraceResult.getStructLogs(result)).toEqual([]);
	});

	it("getStructLogs returns logs", () => {
		const log = StructLog.from({
			pc: 0,
			op: "PUSH1",
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 1000000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gasCost: 3n as any,
			depth: 0,
			stack: ["0x60"],
		});

		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array(),
			structLogs: [log],
		});
		const logs = TraceResult.getStructLogs(result);
		expect(logs.length).toBe(1);
		expect(logs[0]).toBe(log);
	});

	it("getCallTrace returns undefined when not present", () => {
		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array(),
		});
		expect(TraceResult.getCallTrace(result)).toBeUndefined();
	});

	it("getCallTrace returns trace", () => {
		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const fromAddr = new Uint8Array(20).fill(1) as any;
		// biome-ignore lint/suspicious/noExplicitAny: branded type cast
		const toAddr = new Uint8Array(20).fill(2) as any;

		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gasUsed: 50000n as any,
			input: new Uint8Array(),
			output: new Uint8Array(),
		});

		const result = TraceResult.from({
			// biome-ignore lint/suspicious/noExplicitAny: branded bigint type cast
			gas: 50000n as any,
			failed: false,
			returnValue: new Uint8Array(),
			callTrace: trace,
		});
		expect(TraceResult.getCallTrace(result)).toBe(trace);
	});
});
