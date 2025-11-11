import { describe, expect, it } from "vitest";
import * as Frame from "../Frame/index.js";
import { handle as SLT } from "./0x12_SLT.js";

describe("SLT opcode (0x12)", () => {
	it("returns 1 when a < b (both positive)", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a >= b (equal)", () => {
		const frame = Frame.from({
			stack: [20n, 20n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a > b (both positive)", () => {
		const frame = Frame.from({
			stack: [30n, 20n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 1 when negative < positive", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [neg1, 10n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // -1 < 10
	});

	it("returns 0 when positive > negative", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [10n, neg1],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // 10 > -1
	});

	it("compares negative numbers correctly", () => {
		// -10 and -5 in two's complement
		const neg10 = (1n << 256n) - 10n;
		const neg5 = (1n << 256n) - 5n;
		const frame = Frame.from({
			stack: [neg10, neg5],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // -10 < -5
	});

	it("handles -1 < 0", () => {
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [neg1, 0n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // -1 < 0
	});

	it("handles 0 < 1", () => {
		const frame = Frame.from({
			stack: [0n, 1n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles MIN_INT256 < MAX_INT256", () => {
		const MIN_INT256 = 1n << 255n; // -2^255
		const MAX_INT256 = (1n << 255n) - 1n; // 2^255 - 1
		const frame = Frame.from({
			stack: [MIN_INT256, MAX_INT256],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // MIN < MAX
	});

	it("handles MAX_INT256 > MIN_INT256", () => {
		const MIN_INT256 = 1n << 255n;
		const MAX_INT256 = (1n << 255n) - 1n;
		const frame = Frame.from({
			stack: [MAX_INT256, MIN_INT256],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // MAX > MIN
	});

	it("returns StackUnderflow when stack has < 2 items", () => {
		const frame = Frame.from({
			stack: [10n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 2n,
		});

		const err = SLT(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("preserves stack below compared values", () => {
		const frame = Frame.from({
			stack: [100n, 200n, 10n, 20n],
			gasRemaining: 1000n,
		});

		const err = SLT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
