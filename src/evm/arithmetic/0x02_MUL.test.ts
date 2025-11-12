import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { mul } from "./0x02_MUL.js";

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

describe("MUL (0x02)", () => {
	it("multiplies two numbers", () => {
		const frame = createFrame([5n, 10n]);
		const err = mul(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([50n]);
		expect(frame.pc).toBe(1);
	});

	it("handles overflow wrapping", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		const frame = createFrame([MAX_U256, 2n]);
		const err = mul(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([MAX_U256 - 1n]);
		expect(frame.pc).toBe(1);
	});

	it("multiplies by zero", () => {
		const frame = createFrame([42n, 0n]);
		const err = mul(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("multiplies by one", () => {
		const frame = createFrame([42n, 1n]);
		const err = mul(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([42n]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 2 items", () => {
		const frame = createFrame([5n]);
		const err = mul(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([5n, 10n], 4n);
		const err = mul(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes correct gas amount (5)", () => {
		const frame = createFrame([5n, 10n], 100n);
		const err = mul(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(95n);
	});
});
