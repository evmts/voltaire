import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { handle as SGT } from "./0x13_SGT.js";


/**
 * Create a minimal test frame
 */
function createFrame(stack: bigint[], gasRemaining = 1000000n): BrandedFrame {
	return {
		__tag: "Frame",
		stack,
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining,
		bytecode: new Uint8Array(),
		caller: new Uint8Array(20) as any,
		address: new Uint8Array(20) as any,
		value: 0n,
		calldata: new Uint8Array(),
		output: new Uint8Array(),
		returnData: new Uint8Array(),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
	};
}

describe("SGT opcode (0x13)", () => {
	it("returns 1 when a > b (both positive)", () => {
		const frame = Frame.from({
			stack: [30n, 20n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a <= b (equal)", () => {
		const frame = Frame.from({
			stack: [20n, 20n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a < b (both positive)", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when negative < positive", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [neg1, 10n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // -1 < 10
	});

	it("returns 1 when positive > negative", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [10n, neg1],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // 10 > -1
	});

	it("compares negative numbers correctly", () => {
		// -5 and -10 in two's complement
		const neg5 = (1n << 256n) - 5n;
		const neg10 = (1n << 256n) - 10n;
		const frame = Frame.from({
			stack: [neg5, neg10],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // -5 > -10
	});

	it("handles 0 > -1", () => {
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [0n, neg1],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // 0 > -1
	});

	it("handles 1 > 0", () => {
		const frame = Frame.from({
			stack: [1n, 0n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles MAX_INT256 > MIN_INT256", () => {
		const MAX_INT256 = (1n << 255n) - 1n; // 2^255 - 1
		const MIN_INT256 = 1n << 255n; // -2^255
		const frame = Frame.from({
			stack: [MAX_INT256, MIN_INT256],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // MAX > MIN
	});

	it("handles MIN_INT256 < MAX_INT256", () => {
		const MIN_INT256 = 1n << 255n;
		const MAX_INT256 = (1n << 255n) - 1n;
		const frame = Frame.from({
			stack: [MIN_INT256, MAX_INT256],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // MIN < MAX
	});

	it("returns StackUnderflow when stack has < 2 items", () => {
		const frame = Frame.from({
			stack: [10n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 2n,
		});

		const err = SGT(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("preserves stack below compared values", () => {
		const frame = Frame.from({
			stack: [100n, 200n, 30n, 20n],
			gasRemaining: 1000n,
		});

		const err = SGT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
