import { describe, expect, it } from "vitest";
import type { BasicBlock } from "./BrandedBytecode.js";
import { from } from "./from.js";
import { getBlock } from "./getBlock.js";

describe("getBlock", () => {
	it("returns block when PC at block start", () => {
		// Simple bytecode: PUSH1 0x01, STOP
		// Block 0: PC 0-2
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));

		const block = getBlock(bytecode, 0);

		expect(block).toBeDefined();
		expect(block?.startPc).toBe(0);
	});

	it("returns same block when PC in middle of block", () => {
		// PUSH1 0x01, PUSH1 0x02, ADD, STOP
		// Block 0: PC 0-5
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]));

		const block0 = getBlock(bytecode, 0);
		const block2 = getBlock(bytecode, 2);
		const block4 = getBlock(bytecode, 4);

		expect(block0).toBeDefined();
		expect(block2).toBeDefined();
		expect(block4).toBeDefined();
		expect(block0?.index).toBe(block2?.index);
		expect(block0?.index).toBe(block4?.index);
	});

	it("returns block when PC in PUSH data", () => {
		// PUSH2 0xAABB, STOP
		// Block 0: PC 0-4, PUSH data at PC 1-2
		const bytecode = from(new Uint8Array([0x61, 0xaa, 0xbb, 0x00]));

		const block1 = getBlock(bytecode, 1); // Inside PUSH data
		const block2 = getBlock(bytecode, 2); // Inside PUSH data

		expect(block1).toBeDefined();
		expect(block2).toBeDefined();
		expect(block1?.startPc).toBe(0);
		expect(block2?.startPc).toBe(0);
	});

	it("returns undefined when PC out of bounds", () => {
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));

		const block = getBlock(bytecode, 100);

		expect(block).toBeUndefined();
	});

	it("returns undefined when PC equals bytecode length", () => {
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));

		const block = getBlock(bytecode, 3);

		expect(block).toBeUndefined();
	});

	it("returns correct block for multi-block bytecode", () => {
		// Block 0: PUSH1 0x06, JUMP (PC 0-3)
		// Block 1: JUMPDEST, PUSH1 0x01, STOP (PC 5-8)
		const bytecode = from(
			new Uint8Array([
				0x60,
				0x06,
				0x56, // PUSH1 6, JUMP
				0xfe,
				0xfe, // INVALID, INVALID (unreachable)
				0x5b,
				0x60,
				0x01,
				0x00, // JUMPDEST, PUSH1 1, STOP
			]),
		);

		const block0 = getBlock(bytecode, 0);
		const block1 = getBlock(bytecode, 2);
		const block5 = getBlock(bytecode, 5);
		const block7 = getBlock(bytecode, 7);

		expect(block0).toBeDefined();
		expect(block1).toBeDefined();
		expect(block5).toBeDefined();
		expect(block7).toBeDefined();

		// PC 0-2 should be in same block
		expect(block0?.index).toBe(block1?.index);

		// PC 5-7 should be in different block
		expect(block5?.index).not.toBe(block0?.index);
		expect(block5?.index).toBe(block7?.index);
	});

	it("handles bytecode with single instruction", () => {
		const bytecode = from(new Uint8Array([0x00])); // STOP

		const block = getBlock(bytecode, 0);

		expect(block).toBeDefined();
		expect(block?.startPc).toBe(0);
		expect(block?.endPc).toBe(1);
	});

	it("returns undefined for negative PC", () => {
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));

		const block = getBlock(bytecode, -1);

		expect(block).toBeUndefined();
	});

	it("uses cached blocks on subsequent calls", () => {
		const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));

		const block1 = getBlock(bytecode, 0);
		const block2 = getBlock(bytecode, 0);

		// Should return same reference (cached)
		expect(block1).toBe(block2);
	});

	it("handles complex control flow", () => {
		// Block 0: PUSH1 0x09, JUMPI (conditional)
		// Block 1: PUSH1 0x01, JUMP
		// Block 2: JUMPDEST, STOP
		const bytecode = from(
			new Uint8Array([
				0x60,
				0x09,
				0x57, // PUSH1 9, JUMPI
				0x60,
				0x01,
				0x56, // PUSH1 1, JUMP
				0xfe,
				0xfe,
				0xfe, // INVALID padding
				0x5b,
				0x00, // JUMPDEST, STOP
			]),
		);

		const blockAtStart = getBlock(bytecode, 0);
		const blockAtMiddle = getBlock(bytecode, 3);
		const blockAtJumpdest = getBlock(bytecode, 9);

		expect(blockAtStart).toBeDefined();
		expect(blockAtMiddle).toBeDefined();
		expect(blockAtJumpdest).toBeDefined();

		// Different blocks
		expect(blockAtStart?.index).not.toBe(blockAtMiddle?.index);
		expect(blockAtMiddle?.index).not.toBe(blockAtJumpdest?.index);
	});
});
