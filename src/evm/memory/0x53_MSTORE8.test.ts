import { describe, expect, it } from "vitest";
import { Address } from "../../primitives/Address/index.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { mstore8 } from "./0x53_MSTORE8.js";

/**
 * Create a minimal frame for testing
 */
function createTestFrame(overrides?: Partial<BrandedFrame>): BrandedFrame {
	const zeroAddress = Address("0x0000000000000000000000000000000000000000");
	return {
		__tag: "Frame",
		stack: [],
		memory: new Map(),
		memorySize: 0,
		pc: 0,
		gasRemaining: 1000000n,
		bytecode: new Uint8Array(),
		caller: zeroAddress,
		address: zeroAddress,
		value: 0n,
		calldata: new Uint8Array(),
		output: new Uint8Array(),
		returnData: new Uint8Array(),
		stopped: false,
		reverted: false,
		isStatic: false,
		authorized: null,
		callDepth: 0,
		...overrides,
	};
}

describe("MSTORE8 (0x53)", () => {
	it("stores least significant byte to memory at offset 0", () => {
		const frame = createTestFrame();

		frame.stack.push(0x42n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Check stack is empty
		expect(frame.stack.length).toBe(0);

		// Check memory has correct byte
		expect(frame.memory.get(0)).toBe(0x42);

		// PC should increment
		expect(frame.pc).toBe(1);

		// Gas should be consumed
		expect(frame.gasRemaining).toBeLessThan(1000000n);
	});

	it("stores only least significant byte", () => {
		const frame = createTestFrame();

		// Value with multiple bytes
		const value = 0x123456789abcdefn;
		frame.stack.push(value);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Only least significant byte (0xef) should be stored
		expect(frame.memory.get(0)).toBe(0xef);
	});

	it("truncates to 8 bits correctly", () => {
		const frame = createTestFrame();

		// Max uint256 value
		const value = (1n << 256n) - 1n;
		frame.stack.push(value);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Should store 0xff (least significant byte)
		expect(frame.memory.get(0)).toBe(0xff);
	});

	it("stores zero value", () => {
		const frame = createTestFrame();

		// Pre-populate memory
		frame.memory.set(0, 0x99);

		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Memory should be overwritten with zero
		expect(frame.memory.get(0)).toBe(0);
	});

	it("stores to non-zero offset", () => {
		const frame = createTestFrame();

		frame.stack.push(0xabn);
		frame.stack.push(5n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Check byte at offset 5
		expect(frame.memory.get(5)).toBe(0xab);

		// Other offsets should be uninitialized
		expect(frame.memory.has(0)).toBe(false);
		expect(frame.memory.has(4)).toBe(false);
		expect(frame.memory.has(6)).toBe(false);
	});

	it("overwrites existing byte", () => {
		const frame = createTestFrame();

		// First write
		frame.memory.set(10, 0xaa);

		// Overwrite
		frame.stack.push(0xbbn);
		frame.stack.push(10n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		expect(frame.memory.get(10)).toBe(0xbb);
	});

	it("expands memory size correctly for single byte", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);

		frame.stack.push(0x42n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Writing 1 byte should expand to 32 bytes (1 word)
		expect(frame.memorySize).toBe(32);
	});

	it("expands memory to word boundary", () => {
		const frame = createTestFrame();

		// Writing at offset 31 (last byte of first word)
		frame.stack.push(0x99n);
		frame.stack.push(31n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Should expand to 32 bytes (1 word)
		expect(frame.memorySize).toBe(32);
	});

	it("expands to second word when needed", () => {
		const frame = createTestFrame();

		// Writing at offset 32 (first byte of second word)
		frame.stack.push(0x77n);
		frame.stack.push(32n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Should expand to 64 bytes (2 words)
		expect(frame.memorySize).toBe(64);
	});

	it("does not shrink memory size", () => {
		const frame = createTestFrame({ memorySize: 128 });

		frame.stack.push(0x55n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(128);
	});

	it("charges correct gas for memory expansion", () => {
		const frame = createTestFrame({ gasRemaining: 1000n });

		frame.stack.push(0x11n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Base cost: 3 gas
		// Memory expansion: 1 word = 3 + 1²/512 = 3 gas
		// Total: 6 gas
		expect(frame.gasRemaining).toBe(994n);
	});

	it("charges no expansion gas for existing memory", () => {
		const frame = createTestFrame({
			gasRemaining: 1000n,
			memorySize: 32,
		});

		frame.stack.push(0x22n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Only base cost: 3 gas (no expansion needed)
		expect(frame.gasRemaining).toBe(997n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gasRemaining: 2n });

		frame.stack.push(0x33n);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns StackUnderflow when stack has only one item", () => {
		const frame = createTestFrame();
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createTestFrame();

		const result = mstore8(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfBounds for offset beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(0x44n);
		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);

		const result = mstore8(frame);
		expect(result).toEqual({ type: "OutOfBounds" });
	});

	it("handles large but valid offset", () => {
		const frame = createTestFrame({ gasRemaining: 100000000n });

		const largeOffset = 1000000n;
		frame.stack.push(0x88n);
		frame.stack.push(largeOffset);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Check byte was written
		expect(frame.memory.get(Number(largeOffset))).toBe(0x88);
		expect(frame.memorySize).toBeGreaterThan(0);
	});

	it("writes sequential bytes correctly", () => {
		const frame = createTestFrame();

		// Write bytes 0-9
		for (let i = 0; i < 10; i++) {
			frame.stack.push(BigInt(i + 0x30)); // '0'-'9' in ASCII
			frame.stack.push(BigInt(i));
			mstore8(frame);
		}

		// Verify all bytes
		for (let i = 0; i < 10; i++) {
			expect(frame.memory.get(i)).toBe(i + 0x30);
		}
	});

	it("preserves adjacent bytes", () => {
		const frame = createTestFrame();

		// Write at offset 10
		frame.stack.push(0xaan);
		frame.stack.push(10n);
		mstore8(frame);

		// Write at offset 12
		frame.stack.push(0xbbn);
		frame.stack.push(12n);
		mstore8(frame);

		// Check both writes
		expect(frame.memory.get(10)).toBe(0xaa);
		expect(frame.memory.get(12)).toBe(0xbb);

		// Offset 11 should be uninitialized
		expect(frame.memory.has(11)).toBe(false);
	});

	it("handles all byte values 0x00-0xff", () => {
		const frame = createTestFrame();

		// Test all possible byte values
		for (let byte = 0; byte <= 0xff; byte++) {
			frame.stack.push(BigInt(byte));
			frame.stack.push(BigInt(byte));
			mstore8(frame);
			expect(frame.memory.get(byte)).toBe(byte);
		}
	});

	it("handles value with high-order bits set", () => {
		const frame = createTestFrame();

		// Value where all bits except low 8 are set
		const value = ((1n << 256n) - 1n) ^ 0xffn; // All bits set except low 8
		frame.stack.push(value);
		frame.stack.push(0n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Should store 0x00 (low 8 bits)
		expect(frame.memory.get(0)).toBe(0x00);
	});

	it("preserves memory isolation", () => {
		const frame = createTestFrame();

		// Write at various offsets
		frame.stack.push(0x11n);
		frame.stack.push(0n);
		mstore8(frame);

		frame.stack.push(0x22n);
		frame.stack.push(100n);
		mstore8(frame);

		frame.stack.push(0x33n);
		frame.stack.push(500n);
		mstore8(frame);

		// Verify isolation
		expect(frame.memory.get(0)).toBe(0x11);
		expect(frame.memory.get(100)).toBe(0x22);
		expect(frame.memory.get(500)).toBe(0x33);

		// Verify gaps are uninitialized
		expect(frame.memory.has(50)).toBe(false);
		expect(frame.memory.has(200)).toBe(false);
	});

	it("works correctly after MSTORE operation", () => {
		const frame = createTestFrame();

		// Simulate MSTORE writing 32 bytes at offset 0
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, 0xaa);
		}

		// Use MSTORE8 to overwrite byte 10
		frame.stack.push(0xbbn);
		frame.stack.push(10n);

		const result = mstore8(frame);
		expect(result).toBeNull();

		// Check byte 10 is changed
		expect(frame.memory.get(10)).toBe(0xbb);

		// Check adjacent bytes unchanged
		expect(frame.memory.get(9)).toBe(0xaa);
		expect(frame.memory.get(11)).toBe(0xaa);
	});
});
