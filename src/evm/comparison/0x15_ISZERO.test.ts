import { describe, expect, it } from "vitest";
import * as Frame from "../Frame/index.js";
import { handle as ISZERO } from "./0x15_ISZERO.js";

describe("ISZERO opcode (0x15)", () => {
	it("returns 1 when value is zero", () => {
		const frame = Frame.from({
			stack: [0n],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 when value is non-zero", () => {
		const frame = Frame.from({
			stack: [42n],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns 0 for value 1", () => {
		const frame = Frame.from({
			stack: [1n],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for max uint256", () => {
		const MAX_UINT256 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [MAX_UINT256],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for negative value (two's complement)", () => {
		// -1 in two's complement
		const neg1 = (1n << 256n) - 1n;
		const frame = Frame.from({
			stack: [neg1],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]); // Not zero
	});

	it("returns 0 for small positive value", () => {
		const frame = Frame.from({
			stack: [123n],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("returns 0 for large positive value", () => {
		const large = 123456789012345678901234567890n;
		const frame = Frame.from({
			stack: [large],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("can be chained (ISZERO(ISZERO(0)) = 0)", () => {
		const frame = Frame.from({
			stack: [0n],
			gasRemaining: 1000n,
		});

		// First ISZERO
		let err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);

		// Reset PC for second operation
		frame.pc = 0;

		// Second ISZERO
		err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);
	});

	it("can be chained (ISZERO(ISZERO(1)) = 1)", () => {
		const frame = Frame.from({
			stack: [1n],
			gasRemaining: 1000n,
		});

		// First ISZERO
		let err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([0n]);

		// Reset PC for second operation
		frame.pc = 0;

		// Second ISZERO
		err = ISZERO(frame);
		expect(err).toBe(null);
		expect(frame.stack).toEqual([1n]);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = Frame.from({
			stack: [],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = Frame.from({
			stack: [0n],
			gasRemaining: 2n,
		});

		const err = ISZERO(frame);

		expect(err).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
	});

	it("preserves stack below tested value", () => {
		const frame = Frame.from({
			stack: [100n, 200n, 300n, 0n],
			gasRemaining: 1000n,
		});

		const err = ISZERO(frame);

		expect(err).toBe(null);
		expect(frame.stack).toEqual([100n, 200n, 300n, 1n]);
		expect(frame.pc).toBe(1);
	});
});
