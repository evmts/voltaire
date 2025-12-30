import { describe, expect, it } from "vitest";
import * as CallTrace from "./index.js";

describe("CallTrace", () => {
	// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
	const fromAddr = new Uint8Array(20).fill(1) as any;
	// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
	const toAddr = new Uint8Array(20).fill(2) as any;
	const input = new Uint8Array([0x60, 0x60]);
	const output = new Uint8Array([0x01]);

	it("creates basic CALL trace", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			value: 1000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
		});
		expect(trace.type).toBe("CALL");
		expect(trace.from).toBe(fromAddr);
		expect(trace.to).toBe(toAddr);
		expect(trace.value).toBe(1000n);
		expect(trace.gas).toBe(100000n);
		expect(trace.gasUsed).toBe(50000n);
	});

	it("creates CREATE trace without to address", () => {
		const trace = CallTrace.from({
			type: "CREATE",
			from: fromAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 80000n as any,
			input,
			output,
		});
		expect(trace.type).toBe("CREATE");
		expect(trace.to).toBeUndefined();
	});

	it("creates trace with error", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 10000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 10000n as any,
			input,
			output: new Uint8Array(),
			error: "out of gas",
		});
		expect(trace.error).toBe("out of gas");
		expect(CallTrace.hasError(trace)).toBe(true);
	});

	it("creates trace with revert reason", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 50000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 25000n as any,
			input,
			output: new Uint8Array(),
			error: "execution reverted",
			revertReason: "insufficient balance",
		});
		expect(trace.revertReason).toBe("insufficient balance");
	});

	it("creates trace with nested calls", () => {
		const nestedCall = CallTrace.from({
			type: "STATICCALL",
			from: toAddr,
			to: fromAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 20000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 10000n as any,
			input: new Uint8Array(),
			output: new Uint8Array(),
		});

		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
			calls: [nestedCall],
		});
		expect(trace.calls?.length).toBe(1);
		expect(trace.calls?.[0].type).toBe("STATICCALL");
	});

	it("getCalls returns empty array for no calls", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
		});
		expect(CallTrace.getCalls(trace)).toEqual([]);
	});

	it("getCalls returns nested calls", () => {
		const nestedCall = CallTrace.from({
			type: "STATICCALL",
			from: toAddr,
			to: fromAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 20000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 10000n as any,
			input: new Uint8Array(),
			output: new Uint8Array(),
		});

		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
			calls: [nestedCall],
		});
		const calls = CallTrace.getCalls(trace);
		expect(calls.length).toBe(1);
		expect(calls[0]).toBe(nestedCall);
	});

	it("flatten returns single call for no nesting", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
		});
		const flat = CallTrace.flatten(trace);
		expect(flat.length).toBe(1);
		expect(flat[0]).toBe(trace);
	});

	it("flatten returns all calls in tree", () => {
		const deepCall = CallTrace.from({
			type: "DELEGATECALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 5000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 2000n as any,
			input: new Uint8Array(),
			output: new Uint8Array(),
		});

		const nestedCall = CallTrace.from({
			type: "STATICCALL",
			from: toAddr,
			to: fromAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 20000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 10000n as any,
			input: new Uint8Array(),
			output: new Uint8Array(),
			calls: [deepCall],
		});

		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
			calls: [nestedCall],
		});

		const flat = CallTrace.flatten(trace);
		expect(flat.length).toBe(3);
		expect(flat[0]).toBe(trace);
		expect(flat[1]).toBe(nestedCall);
		expect(flat[2]).toBe(deepCall);
	});

	it("hasError returns false for successful call", () => {
		const trace = CallTrace.from({
			type: "CALL",
			from: fromAddr,
			to: toAddr,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gas: 100000n as any,
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			gasUsed: 50000n as any,
			input,
			output,
		});
		expect(CallTrace.hasError(trace)).toBe(false);
	});
});
