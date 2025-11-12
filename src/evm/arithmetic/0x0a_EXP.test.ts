import { describe, expect, it } from "vitest";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { exp } from "./0x0a_EXP.js";

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

describe("EXP (0x0a)", () => {
	it("computes base^exponent", () => {
		// Stack: [exponent, base] (bottom to top) -> pops base, exponent
		const frame = createFrame([3n, 2n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([8n]); // 2^3 = 8
		expect(frame.pc).toBe(1);
	});

	it("handles exponent of 0", () => {
		// Stack: [exponent=0, base] (bottom to top)
		const frame = createFrame([0n, 999n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1n]); // Any number^0 = 1
		expect(frame.pc).toBe(1);
	});

	it("handles base of 0", () => {
		// Stack: [exponent, base=0] (bottom to top)
		const frame = createFrame([5n, 0n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([0n]); // 0^5 = 0
		expect(frame.pc).toBe(1);
	});

	it("handles 0^0 case", () => {
		const frame = createFrame([0n, 0n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1n]); // EVM defines 0^0 = 1
		expect(frame.pc).toBe(1);
	});

	it("handles exponent of 1", () => {
		// Stack: [exponent=1, base] (bottom to top)
		const frame = createFrame([1n, 42n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([42n]); // 42^1 = 42
		expect(frame.pc).toBe(1);
	});

	it("handles overflow wrapping", () => {
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([256n, 2n]);
		const err = exp(frame);

		expect(err).toBeNull();
		// 2^256 wraps to 0 in u256
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("handles large exponent", () => {
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([255n, 2n]);
		const err = exp(frame);

		expect(err).toBeNull();
		// 2^255 in u256
		expect(frame.stack).toEqual([1n << 255n]);
		expect(frame.pc).toBe(1);
	});

	it("handles overflow with large base", () => {
		const MAX_U256 = (1n << 256n) - 1n;
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([2n, MAX_U256]);
		const err = exp(frame);

		expect(err).toBeNull();
		// (MAX_U256)^2 wraps around
		const expected = (MAX_U256 * MAX_U256) & ((1n << 256n) - 1n);
		expect(frame.stack).toEqual([expected]);
		expect(frame.pc).toBe(1);
	});

	it("computes 10^18", () => {
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([18n, 10n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1000000000000000000n]);
		expect(frame.pc).toBe(1);
	});

	it("handles base > 2", () => {
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([10n, 5n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([9765625n]); // 5^10 = 9765625
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack has less than 2 items", () => {
		const frame = createFrame([5n]);
		const err = exp(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createFrame([3n, 2n], 9n);
		const err = exp(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("consumes base gas (10) when exponent is 0", () => {
		// Stack: [exponent=0, base] (bottom to top)
		const frame = createFrame([0n, 999n], 100n);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.gasRemaining).toBe(90n); // 100 - 10 = 90
	});

	it("consumes dynamic gas based on exponent byte length (1 byte)", () => {
		// Exponent = 255 (0xFF) = 1 byte
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([255n, 2n], 1000n);
		const err = exp(frame);

		expect(err).toBeNull();
		// Gas = 10 (base) + 50 * 1 (1 byte) = 60
		expect(frame.gasRemaining).toBe(940n);
	});

	it("consumes dynamic gas based on exponent byte length (2 bytes)", () => {
		// Exponent = 256 (0x0100) = 2 bytes
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([256n, 2n], 1000n);
		const err = exp(frame);

		expect(err).toBeNull();
		// Gas = 10 (base) + 50 * 2 (2 bytes) = 110
		expect(frame.gasRemaining).toBe(890n);
	});

	it("consumes dynamic gas based on exponent byte length (32 bytes)", () => {
		// Exponent = MAX_U256
		const MAX_U256 = (1n << 256n) - 1n;
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([MAX_U256, 2n], 10000n);
		const err = exp(frame);

		expect(err).toBeNull();
		// Gas = 10 (base) + 50 * 32 (32 bytes) = 1610
		expect(frame.gasRemaining).toBe(8390n);
	});

	it("correctly calculates byte length for boundary values", () => {
		// Test 0x80 (128) = 1 byte
		// Stack: [exponent, base] (bottom to top)
		const frame1 = createFrame([128n, 2n], 1000n);
		exp(frame1);
		expect(frame1.gasRemaining).toBe(940n); // 10 + 50*1

		// Test 0x100 (256) = 2 bytes
		const frame2 = createFrame([256n, 2n], 1000n);
		exp(frame2);
		expect(frame2.gasRemaining).toBe(890n); // 10 + 50*2

		// Test 0xFFFF = 2 bytes
		const frame3 = createFrame([65535n, 2n], 1000n);
		exp(frame3);
		expect(frame3.gasRemaining).toBe(890n); // 10 + 50*2

		// Test 0x010000 = 3 bytes
		const frame4 = createFrame([65536n, 2n], 1000n);
		exp(frame4);
		expect(frame4.gasRemaining).toBe(840n); // 10 + 50*3
	});

	it("verifies exponentiation by squaring correctness", () => {
		// Stack: [exponent, base] (bottom to top)
		const frame = createFrame([13n, 3n]);
		const err = exp(frame);

		expect(err).toBeNull();
		expect(frame.stack).toEqual([1594323n]); // 3^13 = 1594323
	});
});
