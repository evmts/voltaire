import { describe, expect, it } from "vitest";
import * as Frame from "../Frame/index.js";
import { handle as LT } from "./0x10_LT.js";

describe("LT opcode (0x10)", () => {
	it("returns 1 when a < b", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

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

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when a > b", () => {
		const frame = Frame.from({
			stack: [30n, 20n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("handles 0 < 1", () => {
		const frame = Frame.from({
			stack: [0n, 1n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles 1 < 0", () => {
		const frame = Frame.from({
			stack: [1n, 0n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("handles max uint256 values", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [MAX_UINT256 - 1n, MAX_UINT256],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("treats all values as unsigned", () => {
		// 2^255 is large positive as unsigned
		const SIGN_BIT = 1n << 255n;
		const frame = Frame.from({
			stack: [1n, SIGN_BIT],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // 1 < 2^255 (unsigned)
	});

	it("returns StackUnderflow when stack has < 2 items", () => {
		const frame = Frame.from({
			stack: [10n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 2n,
		});

		const err = LT(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("handles large value comparisons", () => {
		const a = 123456789012345678901234567890n;
		const b = 987654321098765432109876543210n;

		const frame = Frame.from({
			stack: [a, b],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]); // a < b
	});

	it("preserves stack below compared values", () => {
		const frame = Frame.from({
			stack: [100n, 200n, 10n, 20n],
			gasRemaining: 1000n,
		});

		const err = LT(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
