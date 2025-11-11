import { describe, it, expect } from "vitest";
import { handler_0xa0_LOG0 } from "./0xa0_LOG0.js";
import { handler_0xa2_LOG2 } from "./0xa2_LOG2.js";
import type { BrandedFrame } from "../Frame/BrandedFrame.js";
import { from as addressFrom } from "../../primitives/Address/BrandedAddress/from.js";

/**
 * Create a minimal frame for testing
 */
function createTestFrame(overrides?: Partial<BrandedFrame>): BrandedFrame {
	const zeroAddress = addressFrom("0x0000000000000000000000000000000000000000");
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

describe("LOG0 (0xa0)", () => {
	it("creates log with 0 topics and empty data", () => {
		const addr = addressFrom("0x1234567890123456789012345678901234567890");
		const frame = createTestFrame({ address: addr });

		// Push offset and length (both 0 for empty data)
		frame.stack.push(0n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		// Check log was created
		expect(frame.logs).toBeDefined();
		expect(frame.logs?.length).toBe(1);

		const log = frame.logs?.[0];
		expect(log?.address).toBe(addr);
		expect(log?.topics).toEqual([]);
		expect(log?.data).toEqual(new Uint8Array(0));

		// PC should increment
		expect(frame.pc).toBe(1);

		// Gas should be consumed (375 base + 0 for data)
		expect(frame.gasRemaining).toBe(999625n);
	});

	it("creates log with data from memory", () => {
		const addr = addressFrom("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		const frame = createTestFrame({ address: addr });

		// Write test data to memory
		const testData = new Uint8Array([0x11, 0x22, 0x33, 0x44, 0x55]);
		for (let i = 0; i < testData.length; i++) {
			frame.memory.set(i, testData[i]);
		}

		// Push length and offset
		frame.stack.push(5n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		expect(frame.logs?.length).toBe(1);

		const log = frame.logs?.[0];
		expect(log?.address).toBe(addr);
		expect(log?.topics).toEqual([]);
		expect(log?.data).toEqual(testData);

		// Gas: 375 (base) + 8*5 (data) + 3 (memory expansion for 5 bytes = 32 bytes) = 418
		expect(frame.gasRemaining).toBe(999582n);
	});

	it("creates log with data at non-zero offset", () => {
		const frame = createTestFrame();

		// Write data at offset 100
		const testData = new Uint8Array([0xaa, 0xbb, 0xcc]);
		for (let i = 0; i < testData.length; i++) {
			frame.memory.set(100 + i, testData[i]);
		}

		frame.stack.push(3n); // length
		frame.stack.push(100n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		const log = frame.logs?.[0];
		expect(log?.data).toEqual(testData);
	});

	it("expands memory correctly when reading data", () => {
		const frame = createTestFrame();
		expect(frame.memorySize).toBe(0);

		// Read 10 bytes from offset 0
		frame.stack.push(10n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		// Memory should expand to word boundary (32 bytes)
		expect(frame.memorySize).toBe(32);
	});

	it("expands memory to multiple words", () => {
		const frame = createTestFrame();

		// Read 50 bytes from offset 0 (requires 64 bytes = 2 words)
		frame.stack.push(50n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		expect(frame.memorySize).toBe(64);
	});

	it("returns WriteProtection in static call context", () => {
		const frame = createTestFrame({ isStatic: true });

		frame.stack.push(0n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "WriteProtection" });

		// No log should be created
		expect(frame.logs).toBeUndefined();

		// PC should not increment
		expect(frame.pc).toBe(0);
	});

	it("returns StackUnderflow when stack has 0 items", () => {
		const frame = createTestFrame();

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns StackUnderflow when stack has 1 item", () => {
		const frame = createTestFrame();
		frame.stack.push(0n);

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas for base cost", () => {
		const frame = createTestFrame({ gasRemaining: 374n });

		frame.stack.push(0n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns OutOfGas when insufficient gas for data cost", () => {
		const frame = createTestFrame({ gasRemaining: 400n });

		frame.stack.push(10n); // length (requires 375 + 8*10 = 455 gas)
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("returns OutOfBounds for offset beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(1n); // length
		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "OutOfBounds" });
	});

	it("returns OutOfBounds for length beyond MAX_SAFE_INTEGER", () => {
		const frame = createTestFrame();

		frame.stack.push(BigInt(Number.MAX_SAFE_INTEGER) + 1n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toEqual({ type: "OutOfBounds" });
	});

	it("creates multiple logs", () => {
		const frame = createTestFrame();

		// First log
		frame.stack.push(0n);
		frame.stack.push(0n);
		let result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		// Second log
		frame.stack.push(0n);
		frame.stack.push(0n);
		result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		expect(frame.logs?.length).toBe(2);
	});

	it("handles large data correctly", () => {
		const frame = createTestFrame({ gasRemaining: 100000n });

		// 1000 bytes of data
		const dataLength = 1000;
		for (let i = 0; i < dataLength; i++) {
			frame.memory.set(i, i % 256);
		}

		frame.stack.push(BigInt(dataLength)); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa0_LOG0(frame);
		expect(result).toBeNull();

		const log = frame.logs?.[0];
		expect(log?.data.length).toBe(dataLength);

		// Verify data integrity
		for (let i = 0; i < dataLength; i++) {
			expect(log?.data[i]).toBe(i % 256);
		}

		// Gas: 375 + 8*1000 = 8375 + memory expansion
		expect(frame.gasRemaining).toBeLessThan(100000n - 8375n);
	});
});

describe("LOG2 (0xa2)", () => {
	it("creates log with 2 topics and empty data", () => {
		const addr = addressFrom("0x1234567890123456789012345678901234567890");
		const frame = createTestFrame({ address: addr });

		const topic0 =
			0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan;
		const topic1 =
			0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbn;

		// Push topics, length, and offset (stack order: offset, length, topic0, topic1)
		frame.stack.push(topic1); // topic1
		frame.stack.push(topic0); // topic0
		frame.stack.push(0n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		expect(frame.logs?.length).toBe(1);

		const log = frame.logs?.[0];
		expect(log?.address).toBe(addr);
		expect(log?.topics).toEqual([topic0, topic1]);
		expect(log?.data).toEqual(new Uint8Array(0));

		expect(frame.pc).toBe(1);

		// Gas: 375 (base) + 2*375 (topics) = 1125
		expect(frame.gasRemaining).toBe(998875n);
	});

	it("creates log with 2 topics and data", () => {
		const frame = createTestFrame();

		const topic0 =
			0x1111111111111111111111111111111111111111111111111111111111111111n;
		const topic1 =
			0x2222222222222222222222222222222222222222222222222222222222222222n;

		// Write data to memory
		const testData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
		for (let i = 0; i < testData.length; i++) {
			frame.memory.set(i, testData[i]);
		}

		frame.stack.push(topic1);
		frame.stack.push(topic0);
		frame.stack.push(4n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		const log = frame.logs?.[0];
		expect(log?.topics).toEqual([topic0, topic1]);
		expect(log?.data).toEqual(testData);

		// Gas: 375 + 2*375 + 8*4 + 3 (memory expansion for 4 bytes = 32 bytes) = 1160
		expect(frame.gasRemaining).toBe(998840n);
	});

	it("returns WriteProtection in static call context", () => {
		const frame = createTestFrame({ isStatic: true });

		frame.stack.push(0n);
		frame.stack.push(0n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = handler_0xa2_LOG2(frame);
		expect(result).toEqual({ type: "WriteProtection" });
		expect(frame.logs).toBeUndefined();
	});

	it("returns StackUnderflow when stack has 3 items", () => {
		const frame = createTestFrame();
		frame.stack.push(0n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = handler_0xa2_LOG2(frame);
		expect(result).toEqual({ type: "StackUnderflow" });
	});

	it("returns OutOfGas when insufficient gas", () => {
		const frame = createTestFrame({ gasRemaining: 1000n });

		frame.stack.push(0n);
		frame.stack.push(0n);
		frame.stack.push(0n);
		frame.stack.push(0n);

		const result = handler_0xa2_LOG2(frame);
		expect(result).toEqual({ type: "OutOfGas" });
	});

	it("handles topic values at boundaries", () => {
		const frame = createTestFrame();

		const maxUint256 = (1n << 256n) - 1n;
		const zero = 0n;

		frame.stack.push(maxUint256); // topic1
		frame.stack.push(zero); // topic0
		frame.stack.push(0n); // length
		frame.stack.push(0n); // offset

		const result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		const log = frame.logs?.[0];
		expect(log?.topics).toEqual([zero, maxUint256]);
	});

	it("creates multiple LOG2 entries", () => {
		const frame = createTestFrame();

		// First log
		frame.stack.push(0x2n);
		frame.stack.push(0x1n);
		frame.stack.push(0n);
		frame.stack.push(0n);
		let result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		// Second log
		frame.stack.push(0x4n);
		frame.stack.push(0x3n);
		frame.stack.push(0n);
		frame.stack.push(0n);
		result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		expect(frame.logs?.length).toBe(2);
		expect(frame.logs?.[0]?.topics).toEqual([0x1n, 0x2n]);
		expect(frame.logs?.[1]?.topics).toEqual([0x3n, 0x4n]);
	});

	it("expands memory correctly with large data", () => {
		const frame = createTestFrame({ gasRemaining: 100000n });

		const dataLength = 100;
		for (let i = 0; i < dataLength; i++) {
			frame.memory.set(50 + i, 0xff);
		}

		frame.stack.push(0xffffn);
		frame.stack.push(0xeeeeen);
		frame.stack.push(BigInt(dataLength)); // length
		frame.stack.push(50n); // offset

		const result = handler_0xa2_LOG2(frame);
		expect(result).toBeNull();

		// Memory should expand to cover offset 50 + length 100 = 150 bytes
		// Word-aligned to 160 bytes (5 words * 32)
		expect(frame.memorySize).toBe(160);
	});
});
