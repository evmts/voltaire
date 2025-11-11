import { describe, it, expect } from "vitest";
import { mstore } from "./0x52_MSTORE.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { Address } from "../../primitives/Address/index.js";

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

describe("MSTORE (0x52)", () => {
	it("stores 32 bytes to memory at offset 0", () => {
		const frame = createTestFrame();

		const value =
			0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20n;
		frame.stack.push(value); // value
		frame.stack.push(0n); // offset

		const result = mstore(frame);
		expect(result).toBeNull();

		// Check stack is empty (both values consumed)
		expect(frame.stack.length).toBe(0);

		// Check memory has correct bytes in big-endian order
		for (let i = 0; i < 32; i++) {
			const expected = Number((value >> BigInt((31 - i) * 8)) & 0xffn);
			expect(frame.memory.get(i)).toBe(expected);
		}

		// PC should increment
		expect(frame.pc).toBe(1);

		// Gas should be consumed
		expect(frame.gasRemaining).toBeLessThan(1000000n);
	});

	it("stores to offset 32", () => {
		const frame = createTestFrame();

		const value = (1n << 256n) - 1n; // Max uint256 (all 0xff)
		frame.stack.push(value);
		frame.stack.push(32n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Check bytes 32-63 are all 0xff
		for (let i = 32; i < 64; i++) {
			expect(frame.memory.get(i)).toBe(0xff);
		}

		// Bytes 0-31 should be uninitialized
		expect(frame.memory.has(0)).toBe(false);
	});

	it("stores zero value", () => {
		const frame = createTestFrame();

		// Pre-populate memory with non-zero values
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, 0xff);
		}

		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Check memory was overwritten with zeros
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(0);
		}
	});

	it("overwrites existing memory", () => {
		const frame = createTestFrame();

		// First write
		frame.stack.push(
			0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan,
		);
		frame.stack.push(0n);
		mstore(frame);

		// Second write at same offset
		frame.stack.push(
			0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbn,
		);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Check memory has second value
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(0xbb);
		}
	});

	it("expands memory size correctly", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);

		frame.stack.push(0x1234n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Writing 32 bytes should expand to 32 bytes (1 word)
		expect(frame.memorySize).toBe(32);
	});

	it("expands memory to word boundary", () => {
		const frame = createTestFrame();

		// Writing at offset 1 means bytes 1-32 (33 bytes total)
		// Should expand to 64 bytes (2 words)
		frame.stack.push(0xabn);
		frame.stack.push(1n);

		const result = mstore(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(64);
	});

	it("does not shrink memory size", () => {
		const frame = createTestFrame({ memorySize: 128 });

		frame.stack.push(0x99n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(128);
	});

	it("charges correct gas for memory expansion", () => {
		const frame = createTestFrame({ gasRemaining: 1000n });

		frame.stack.push(0x42n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Base cost: 3 gas
		// Memory expansion: 1 word = 3 + 1²/512 = 3 gas
		// Total: 6 gas
		expect(frame.gasRemaining).toBe(994n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gasRemaining: 2n });

		frame.stack.push(0x11n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns StackUnderflow when stack has only one item", () => {
		const frame = createTestFrame();
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createTestFrame();

		const result = mstore(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfBounds for offset beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(0x99n);
		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);

		const result = mstore(frame);
		expect(result).toEqual({ type: "OutOfBounds" });
	});

	it("handles large but valid offset", () => {
		const frame = createTestFrame({ gasRemaining: 100000000n });

		const largeOffset = 1000000n;
		frame.stack.push(0x42n);
		frame.stack.push(largeOffset);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Check bytes were written
		const off = Number(largeOffset);
		expect(frame.memory.get(off + 31)).toBe(0x42);
		expect(frame.memorySize).toBeGreaterThan(0);
	});

	it("writes correct endianness (big-endian)", () => {
		const frame = createTestFrame();

		// Value with recognizable byte pattern
		const value = 0x12345678n;
		frame.stack.push(value);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Big-endian: most significant byte first
		// 0x12345678 stored as 32 bytes means:
		// bytes 0-27 are 0x00, bytes 28-31 are 0x12, 0x34, 0x56, 0x78
		expect(frame.memory.get(28)).toBe(0x12);
		expect(frame.memory.get(29)).toBe(0x34);
		expect(frame.memory.get(30)).toBe(0x56);
		expect(frame.memory.get(31)).toBe(0x78);

		// Earlier bytes should be zero
		for (let i = 0; i < 28; i++) {
			expect(frame.memory.get(i)).toBe(0);
		}
	});

	it("handles partial overwrites correctly", () => {
		const frame = createTestFrame();

		// Write at offset 16 (overlaps with first word)
		frame.stack.push(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		);
		frame.stack.push(16n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Bytes 16-47 should be 0xff
		for (let i = 16; i < 48; i++) {
			expect(frame.memory.get(i)).toBe(0xff);
		}

		// Bytes 0-15 should be uninitialized
		expect(frame.memory.has(0)).toBe(false);
	});

	it("maintains memory isolation between operations", () => {
		const frame = createTestFrame();

		// Write at offset 0
		frame.stack.push(0xaan);
		frame.stack.push(0n);
		mstore(frame);

		// Write at offset 64
		frame.stack.push(0xbbn);
		frame.stack.push(64n);
		mstore(frame);

		// Check both writes are isolated
		expect(frame.memory.get(31)).toBe(0xaa);
		expect(frame.memory.get(95)).toBe(0xbb);

		// Middle bytes should be uninitialized
		expect(frame.memory.has(32)).toBe(false);
	});

	it("handles single byte value correctly", () => {
		const frame = createTestFrame();

		// Only least significant byte is non-zero
		frame.stack.push(0x42n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// First 31 bytes should be 0, last byte should be 0x42
		for (let i = 0; i < 31; i++) {
			expect(frame.memory.get(i)).toBe(0);
		}
		expect(frame.memory.get(31)).toBe(0x42);
	});

	it("preserves unaffected memory regions", () => {
		const frame = createTestFrame();

		// Initialize memory at offset 100
		frame.memory.set(100, 0x99);

		// Write at offset 0
		frame.stack.push(0x42n);
		frame.stack.push(0n);

		const result = mstore(frame);
		expect(result).toBeNull();

		// Memory at offset 100 should be unchanged
		expect(frame.memory.get(100)).toBe(0x99);
	});
});
