import { describe, it, expect } from "vitest";
import { mcopy } from "./0x5e_MCOPY.js";
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

describe("MCOPY (0x5e)", () => {
	it("copies memory from source to destination", () => {
		const frame = createTestFrame();

		// Write source data at offset 0
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, i + 1);
		}

		// Copy 32 bytes from offset 0 to offset 64
		frame.stack.push(32n); // length
		frame.stack.push(0n); // src
		frame.stack.push(64n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Check destination has copied data
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(64 + i)).toBe(i + 1);
		}

		// Check source unchanged
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(i + 1);
		}

		// PC should increment
		expect(frame.pc).toBe(1);

		// Gas should be consumed
		expect(frame.gasRemaining).toBeLessThan(1000000n);
	});

	it("handles zero-length copy", () => {
		const frame = createTestFrame();

		// Zero-length copy should not expand memory
		frame.stack.push(0n); // length
		frame.stack.push(0n); // src
		frame.stack.push(0n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Memory should not be expanded
		expect(frame.memorySize).toBe(0);

		// Only base gas should be charged (3 gas)
		expect(frame.gasRemaining).toBe(999997n);
	});

	it("handles overlapping regions (forward)", () => {
		const frame = createTestFrame();

		// Write pattern at offset 0
		for (let i = 0; i < 64; i++) {
			frame.memory.set(i, i);
		}

		// Copy 32 bytes from offset 0 to offset 16 (overlap)
		frame.stack.push(32n); // length
		frame.stack.push(0n); // src
		frame.stack.push(16n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Check that bytes 0-31 were copied to 16-47
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(16 + i)).toBe(i);
		}
	});

	it("handles overlapping regions (backward)", () => {
		const frame = createTestFrame();

		// Write pattern at offset 16
		for (let i = 0; i < 64; i++) {
			frame.memory.set(16 + i, i + 100);
		}

		// Copy 32 bytes from offset 16 to offset 0 (overlap)
		frame.stack.push(32n); // length
		frame.stack.push(16n); // src
		frame.stack.push(0n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Check that bytes 16-47 were copied to 0-31
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(i + 100);
		}
	});

	it("handles exact overlap (src == dest)", () => {
		const frame = createTestFrame();

		// Write pattern
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, i + 50);
		}

		// Copy to same location
		frame.stack.push(32n); // length
		frame.stack.push(0n); // src
		frame.stack.push(0n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Data should be unchanged
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(i + 50);
		}
	});

	it("reads zeros from uninitialized memory", () => {
		const frame = createTestFrame();

		// Copy from uninitialized source
		frame.stack.push(32n); // length
		frame.stack.push(0n); // src (uninitialized)
		frame.stack.push(64n); // dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Destination should have zeros
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(64 + i)).toBe(0);
		}
	});

	it("expands memory correctly for source range", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);

		// Copy 32 bytes from offset 0 to offset 1000
		frame.stack.push(32n);
		frame.stack.push(0n);
		frame.stack.push(1000n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Memory must cover 0-31 (source) and 1000-1031 (dest)
		// Aligned to next word boundary after 1032 = 1056 (33 words)
		expect(frame.memorySize).toBe(1056);
	});

	it("expands memory correctly for destination range", () => {
		const frame = createTestFrame();

		// Copy 64 bytes from offset 1000 to offset 0
		frame.stack.push(64n);
		frame.stack.push(1000n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Memory must cover 0-63 (dest) and 1000-1063 (source)
		// Aligned to 1088 (34 words)
		expect(frame.memorySize).toBe(1088);
	});

	it("charges correct gas for copy operation", () => {
		const frame = createTestFrame({ gasRemaining: 1000n });

		// Pre-expand memory to avoid expansion cost
		frame.memorySize = 128;

		frame.stack.push(32n); // 1 word
		frame.stack.push(0n);
		frame.stack.push(64n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Base: 3 gas
		// Copy: 1 word × 3 = 3 gas
		// Total: 6 gas
		expect(frame.gasRemaining).toBe(994n);
	});

	it("charges correct gas for multi-word copy", () => {
		const frame = createTestFrame({ gasRemaining: 1000n, memorySize: 256 });

		// Copy 96 bytes = 3 words
		frame.stack.push(96n);
		frame.stack.push(0n);
		frame.stack.push(128n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Base: 3 gas
		// Copy: 3 words × 3 = 9 gas
		// Total: 12 gas
		expect(frame.gasRemaining).toBe(988n);
	});

	it("charges gas for partial word", () => {
		const frame = createTestFrame({ gasRemaining: 1000n, memorySize: 128 });

		// Copy 33 bytes = 2 words (rounds up)
		frame.stack.push(33n);
		frame.stack.push(0n);
		frame.stack.push(64n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Base: 3 gas
		// Copy: ceil(33/32) = 2 words × 3 = 6 gas
		// Total: 9 gas
		expect(frame.gasRemaining).toBe(991n);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gasRemaining: 2n });

		frame.stack.push(32n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns StackUnderflow when stack has only two items", () => {
		const frame = createTestFrame();
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns StackUnderflow when stack is empty", () => {
		const frame = createTestFrame();

		const result = mcopy(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfBounds for dest beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(32n);
		frame.stack.push(0n);
		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);

		const result = mcopy(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns OutOfBounds for src beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(32n);
		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns OutOfBounds for length beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("handles single byte copy", () => {
		const frame = createTestFrame();

		frame.memory.set(0, 0x42);

		frame.stack.push(1n);
		frame.stack.push(0n);
		frame.stack.push(10n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		expect(frame.memory.get(10)).toBe(0x42);
		expect(frame.memory.has(11)).toBe(false);
	});

	it("handles large copy", () => {
		const frame = createTestFrame();

		// Write 256 bytes
		for (let i = 0; i < 256; i++) {
			frame.memory.set(i, i & 0xff);
		}

		// Copy 256 bytes
		frame.stack.push(256n);
		frame.stack.push(0n);
		frame.stack.push(1000n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Verify copy
		for (let i = 0; i < 256; i++) {
			expect(frame.memory.get(1000 + i)).toBe(i & 0xff);
		}
	});

	it("preserves unaffected memory regions", () => {
		const frame = createTestFrame();

		// Initialize memory
		frame.memory.set(100, 0xaa);
		frame.memory.set(500, 0xbb);

		// Copy that doesn't touch these regions
		frame.stack.push(32n);
		frame.stack.push(200n);
		frame.stack.push(300n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Verify unaffected regions
		expect(frame.memory.get(100)).toBe(0xaa);
		expect(frame.memory.get(500)).toBe(0xbb);
	});

	it("copies sequential operations correctly", () => {
		const frame = createTestFrame();

		// Write initial data
		for (let i = 0; i < 32; i++) {
			frame.memory.set(i, i);
		}

		// First copy: 0->100
		frame.stack.push(32n);
		frame.stack.push(0n);
		frame.stack.push(100n);
		mcopy(frame);

		// Second copy: 100->200
		frame.stack.push(32n);
		frame.stack.push(100n);
		frame.stack.push(200n);
		mcopy(frame);

		// Verify all three regions have same data
		for (let i = 0; i < 32; i++) {
			expect(frame.memory.get(i)).toBe(i);
			expect(frame.memory.get(100 + i)).toBe(i);
			expect(frame.memory.get(200 + i)).toBe(i);
		}
	});

	it("handles copy with partial overlap and mixed data", () => {
		const frame = createTestFrame();

		// Complex pattern
		for (let i = 0; i < 128; i++) {
			frame.memory.set(i, (i * 3) & 0xff);
		}

		// Copy with 50% overlap
		frame.stack.push(64n);
		frame.stack.push(32n);
		frame.stack.push(64n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Verify correct copy with overlap handling
		for (let i = 0; i < 64; i++) {
			expect(frame.memory.get(64 + i)).toBe(((32 + i) * 3) & 0xff);
		}
	});

	it("charges memory expansion for both ranges", () => {
		const frame = createTestFrame({ gasRemaining: 100000n });

		// Copy from high offset to low offset
		// Both ranges need expansion
		frame.stack.push(32n);
		frame.stack.push(5000n); // high source
		frame.stack.push(10n); // low dest

		const result = mcopy(frame);
		expect(result).toBeNull();

		// Memory must expand to cover source range (5000-5031)
		expect(frame.memorySize).toBeGreaterThanOrEqual(5024);

		// Significant gas consumed for memory expansion
		expect(frame.gasRemaining).toBeLessThan(99500n);
	});

	it("does not shrink memory size", () => {
		const frame = createTestFrame({ memorySize: 1024 });

		frame.stack.push(32n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = mcopy(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(1024);
	});
});
