/**
 * Test file for ADD (0x01) documentation examples
 * Tests examples from add.mdx
 */
import { describe, expect, it } from "vitest";

describe("ADD (0x01) - Documentation Examples", async () => {
	// Dynamic import for ESM compatibility
	const { add } = await import("../../../../src/evm/arithmetic/index.js");
	const { Frame } = await import("../../../../src/evm/Frame/index.js");

	/**
	 * Create a test frame with stack and optional gas
	 */
	function createFrame(stack: bigint[], gasRemaining = 1000000n) {
		const frame = Frame({ gas: gasRemaining });
		frame.stack = [...stack];
		return frame;
	}

	describe("Basic Addition", () => {
		it("5 + 10 = 15", () => {
			const frame = createFrame([5n, 10n]);
			const err = add(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([15n]);
		});
	});

	describe("Overflow Wrapping", () => {
		it("MAX_U256 + 1 wraps to 0", () => {
			const MAX_U256 = (1n << 256n) - 1n;
			const frame = createFrame([MAX_U256, 1n]);
			const err = add(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([0n]);
		});
	});

	describe("Large Overflow", () => {
		it("MAX + MAX wraps to MAX - 1", () => {
			const MAX_U256 = (1n << 256n) - 1n;
			const frame = createFrame([MAX_U256, MAX_U256]);
			const err = add(frame);

			expect(err).toBeNull();
			// (MAX + MAX) mod 2^256 = (2^256 - 2)
			expect(frame.stack).toEqual([MAX_U256 - 1n]);
		});
	});

	describe("Identity Element", () => {
		it("42 + 0 = 42", () => {
			const frame = createFrame([42n, 0n]);
			const err = add(frame);

			expect(err).toBeNull();
			expect(frame.stack).toEqual([42n]);
		});
	});

	describe("Commutative Property", () => {
		it("a + b = b + a", () => {
			const frame1 = createFrame([5n, 10n]);
			add(frame1);

			const frame2 = createFrame([10n, 5n]);
			add(frame2);

			expect(frame1.stack[0]).toBe(frame2.stack[0]);
			expect(frame1.stack[0]).toBe(15n);
		});
	});

	describe("Edge Cases", () => {
		it("0 + 0 = 0", () => {
			const frame = createFrame([0n, 0n]);
			add(frame);

			expect(frame.stack).toEqual([0n]);
		});

		it("returns StackUnderflow with insufficient stack", () => {
			const frame = createFrame([5n]);
			const err = add(frame);

			expect(err).toEqual({ type: "StackUnderflow" });
		});

		it("returns OutOfGas when insufficient gas", () => {
			const frame = createFrame([5n, 10n], 2n);
			const err = add(frame);

			expect(err).toEqual({ type: "OutOfGas" });
			expect(frame.gasRemaining).toBe(0n);
		});
	});

	describe("Gas Cost", () => {
		it("consumes 3 gas (GasFastestStep)", () => {
			const frame = createFrame([5n, 10n], 100n);
			const err = add(frame);

			expect(err).toBeNull();
			expect(frame.gasRemaining).toBe(97n);
		});
	});
});
