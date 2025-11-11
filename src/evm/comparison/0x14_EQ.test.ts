import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { handle as EQ } from "./0x14_EQ.js";


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

describe("EQ opcode (0x14)", () => {
	it("returns 1 when values are equal", () => {
		const frame = Frame.from({
			stack: [42n, 42n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when values are not equal", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("handles 0 == 0", () => {
		const frame = Frame.from({
			stack: [0n, 0n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles 0 != 1", () => {
		const frame = Frame.from({
			stack: [0n, 1n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("handles max uint256 equality", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [MAX_UINT256, MAX_UINT256],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles max uint256 inequality", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [MAX_UINT256 - 1n, MAX_UINT256],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("is symmetric (order doesn't matter)", () => {
		const frame1 = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 1000n,
		});

		const frame2 = Frame.from({
			stack: [20n, 10n],
			gasRemaining: 1000n,
		});

		const err1 = EQ(frame1);
		const err2 = EQ(frame2);

		expect(err1).toBe(null);
		expect(err2).toBe(null);
		expect(frame1.stack).toEqual(frame2.stack);
	});

	it("handles large value equality", () => {
		const large = 123456789012345678901234567890n;
		const frame = Frame.from({
			stack: [large, large],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("handles large value inequality", () => {
		const a = 123456789012345678901234567890n;
		const b = 123456789012345678901234567891n;
		const frame = Frame.from({
			stack: [a, b],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns StackUnderflow when stack has < 2 items", () => {
		const frame = Frame.from({
			stack: [10n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = Frame.from({
			stack: [10n, 20n],
			gasRemaining: 2n,
		});

		const err = EQ(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("preserves stack below compared values", () => {
		const frame = Frame.from({
			stack: [100n, 200n, 42n, 42n],
			gasRemaining: 1000n,
		});

		const err = EQ(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
