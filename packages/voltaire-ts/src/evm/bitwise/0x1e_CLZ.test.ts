import { describe, expect, it } from "vitest";
import type { HardforkType } from "../../primitives/Hardfork/HardforkType.js";
import * as Hardfork from "../../primitives/Hardfork/index.js";
import type { BrandedFrame } from "../Frame/FrameType.js";
import { handle as clz } from "./0x1e_CLZ.js";
import * as Bitwise from "./index.js";

const MAX_U256 = (1n << 256n) - 1n;

function createFrame(
	stack: bigint[],
	gasRemaining = 1000000n,
	hardfork?: HardforkType,
): BrandedFrame {
	return {
		__tag: "Frame",
		stack,
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining,
		bytecode: new Uint8Array(),
		// biome-ignore lint/suspicious/noExplicitAny: mock Frame for test
		caller: new Uint8Array(20) as any,
		// biome-ignore lint/suspicious/noExplicitAny: mock Frame for test
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
		...(hardfork === undefined ? {} : { hardfork }),
	};
}

/** Reference: scan from the most significant bit. */
function referenceClz(x: bigint): bigint {
	let count = 0n;
	for (let bit = 255n; bit >= 0n; bit--) {
		if ((x >> bit) & 1n) break;
		count++;
	}
	return count;
}

describe("CLZ (0x1e, EIP-7939)", () => {
	it("returns 256 for zero", () => {
		const frame = createFrame([0n]);
		expect(clz(frame)).toBeNull();
		expect(frame.stack).toEqual([256n]);
		expect(frame.pc).toBe(1);
	});

	it("matches the EIP-7939 examples", () => {
		const cases: Array<[bigint, bigint]> = [
			[1n << 255n, 0n],
			[MAX_U256, 0n],
			[1n << 254n, 1n],
			[(1n << 255n) - 1n, 1n],
			[1n, 255n],
		];
		for (const [value, expected] of cases) {
			const frame = createFrame([value]);
			expect(clz(frame)).toBeNull();
			expect(frame.stack).toEqual([expected]);
		}
	});

	it("matches a bit-scan reference for every single-bit value and its neighbors", () => {
		for (let bit = 0n; bit < 256n; bit++) {
			for (const value of [1n << bit, (1n << bit) - 1n, (1n << bit) | 1n]) {
				const frame = createFrame([value]);
				expect(clz(frame)).toBeNull();
				expect(frame.stack).toEqual([referenceClz(value)]);
			}
		}
	});

	it("charges exactly 5 gas", () => {
		const frame = createFrame([1n], 100n);
		expect(clz(frame)).toBeNull();
		expect(frame.gasRemaining).toBe(95n);
	});

	it("succeeds with exactly 5 gas", () => {
		const frame = createFrame([1n], 5n);
		expect(clz(frame)).toBeNull();
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.stack).toEqual([255n]);
	});

	it("returns OutOfGas with 4 gas and leaves the stack untouched", () => {
		const frame = createFrame([1n], 4n);
		expect(clz(frame)).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(0);
	});

	it("returns StackUnderflow on an empty stack", () => {
		const frame = createFrame([]);
		expect(clz(frame)).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("only consumes the top stack item", () => {
		const frame = createFrame([7n, 0xffn]);
		expect(clz(frame)).toBeNull();
		expect(frame.stack).toEqual([7n, 248n]);
	});

	it("is invalid before Osaka and charges nothing", () => {
		for (const fork of [Hardfork.CANCUN, Hardfork.PRAGUE]) {
			const frame = createFrame([1n], 100n, fork);
			expect(clz(frame)).toEqual({ type: "InvalidOpcode" });
			expect(frame.gasRemaining).toBe(100n);
			expect(frame.stack).toEqual([1n]);
			expect(frame.pc).toBe(0);
		}
	});

	it("is available from Osaka", () => {
		for (const fork of [Hardfork.OSAKA, Hardfork.AMSTERDAM]) {
			const frame = createFrame([1n], 100n, fork);
			expect(clz(frame)).toBeNull();
			expect(frame.stack).toEqual([255n]);
		}
	});

	it("is exported from the bitwise index as CLZ", () => {
		expect(Bitwise.CLZ).toBe(clz);
	});
});
