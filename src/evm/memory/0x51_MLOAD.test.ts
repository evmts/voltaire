import { describe, it, expect } from "vitest";
import { mload } from "./0x51_MLOAD.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { Address } from "../../primitives/Address/index.js";

/**
 * Create a minimal frame for testing
 */
function createTestFrame(
	overrides?: Partial<BrandedFrame>,
): BrandedFrame {
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

describe("MLOAD (0x51)", () => {
	it("loads 32 bytes from memory at offset 0", () => {
		const frame = createTestFrame();

		// Pre-populate memory with known values
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, i + 1);
		}

		// Push offset 0 onto stack
		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		// Check stack has result
		expect(frame.stack.length).toBe(1);

		// Expected value: bytes 1-32 as big-endian 256-bit number
		// 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20
		const expected = 0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20n;
		expect(frame.stack[0]).toBe(expected);

		// PC should increment
		expect(frame.pc).toBe(1);

		// Gas should be consumed (3 base + memory expansion)
		expect(frame.gasRemaining).toBeLessThan(1000000n);
	});

	it("loads from offset 32", () => {
		const frame = createTestFrame();

		// Populate memory at offset 32-63
		for (let i = 0; i < 32; i++) {
			frame.memory.set(32 + i, 0xff);
		}

		frame.stack.push(32n);

		const result = mload(frame);
		expect(result).toBeNull();

		expect(frame.stack.length).toBe(1);
		// All bytes are 0xff
		const expected = (1n << 256n) - 1n; // Max uint256
		expect(frame.stack[0]).toBe(expected);
	});

	it("loads zero from uninitialized memory", () => {
		const frame = createTestFrame();

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		expect(frame.stack.length).toBe(1);
		expect(frame.stack[0]).toBe(0n);
	});

	it("handles partial memory initialization", () => {
		const frame = createTestFrame();

		// Initialize only first 16 bytes
		for (let i = 0; i < 16; i++) {
			frame.memory.set(i, 0x11);
		}
		// Bytes 16-31 remain uninitialized (will read as 0)

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		expect(frame.stack.length).toBe(1);
		// First 16 bytes are 0x11, last 16 bytes are 0x00
		const expected = 0x11111111111111111111111111111111_00000000000000000000000000000000n;
		expect(frame.stack[0]).toBe(expected);
	});

	it("expands memory size correctly", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		// Reading 32 bytes should expand to 32 bytes (1 word)
		expect(frame.memorySize).toBe(32);
	});

	it("expands memory to word boundary", () => {
		const frame = createTestFrame();

		// Reading from offset 1 means bytes 1-32 (33 bytes total)
		// Should expand to 64 bytes (2 words)
		frame.stack.push(1n);

		const result = mload(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(64);
	});

	it("does not shrink memory size", () => {
		const frame = createTestFrame({ memorySize: 128 });

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		// Memory size should not decrease
		expect(frame.memorySize).toBe(128);
	});

	it("charges correct gas for memory expansion", () => {
		const frame = createTestFrame({ gasRemaining: 1000n });

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		// Base cost: 3 gas
		// Memory expansion: 1 word = 3 + 1²/512 = 3 gas
		// Total: 6 gas
		expect(frame.gasRemaining).toBe(994n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gasRemaining: 2n });

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createTestFrame();

		const result = mload(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfBounds for offset beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);

		const result = mload(frame);
		expect(result).toEqual({ type: "OutOfBounds" });
	});

	it("handles large but valid offset", () => {
		const frame = createTestFrame();

		const largeOffset = 1000000n;
		frame.stack.push(largeOffset);

		const result = mload(frame);
		expect(result).toBeNull();

		// Should read zeros and expand memory
		expect(frame.stack[0]).toBe(0n);
		expect(frame.memorySize).toBeGreaterThan(0);
	});

	it("reads correct value with non-zero offset", () => {
		const frame = createTestFrame();

		// Write pattern at offset 10
		for (let i = 0; i < 32; i++) {
			frame.memory.set(10 + i, i);
		}

		frame.stack.push(10n);

		const result = mload(frame);
		expect(result).toBeNull();

		// Construct expected value from bytes 0-31
		let expected = 0n;
		for (let i = 0; i < 32; i++) {
			expected = (expected << 8n) | BigInt(i);
		}

		expect(frame.stack[0]).toBe(expected);
	});

	it("maintains stack depth correctly", () => {
		const frame = createTestFrame();

		// Pre-fill stack
		frame.stack.push(100n);
		frame.stack.push(200n);
		frame.stack.push(0n); // offset for MLOAD

		const result = mload(frame);
		expect(result).toBeNull();

		// Stack should have original 2 items + result
		expect(frame.stack.length).toBe(3);
		expect(frame.stack[0]).toBe(100n);
		expect(frame.stack[1]).toBe(200n);
		// frame.stack[2] is the loaded value
	});

	it("handles maximum memory expansion gas cost", () => {
		const frame = createTestFrame({ gasRemaining: 1000000n });

		// Very large offset requiring significant memory expansion
		frame.stack.push(1000000n);

		const result = mload(frame);

		// Should succeed but consume significant gas
		expect(result).toBeNull();
		expect(frame.gasRemaining).toBeLessThan(500000n);
	});

	it("reads correct endianness (big-endian)", () => {
		const frame = createTestFrame();

		// Write specific pattern to test endianness
		frame.memory.set(0, 0x12);
		frame.memory.set(1, 0x34);
		frame.memory.set(2, 0x56);
		frame.memory.set(3, 0x78);
		// Rest are zeros

		frame.stack.push(0n);

		const result = mload(frame);
		expect(result).toBeNull();

		// First 4 bytes should form 0x12345678 at the high end
		const value = frame.stack[0];
		const highBytes = value >> 224n; // Shift down to get top 4 bytes
		expect(highBytes).toBe(0x12345678n);
	});
});
