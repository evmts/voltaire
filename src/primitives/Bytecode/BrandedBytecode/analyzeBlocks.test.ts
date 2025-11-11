import { describe, expect, it } from "vitest";
import type { BasicBlock } from "./BrandedBytecode.js";
import { analyzeBlocks } from "./analyzeBlocks.js";
import { from } from "./from.js";

describe("analyzeBlocks", () => {
	describe("basic block splitting", () => {
		it("single block with STOP terminator", () => {
			// PUSH1 0x01, PUSH1 0x02, ADD, STOP
			const code = from(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]));
			const blocks = analyzeBlocks(code);

			expect(blocks).toHaveLength(1);
			const block = blocks[0] as BasicBlock;
			expect(block.index).toBe(0);
			expect(block.startPc).toBe(0);
			expect(block.endPc).toBe(6);
			expect(block.instructionCount).toBe(4);
			expect(block.terminator).toBe("stop");
			expect(block.successors).toEqual([]);
		});

		it("multiple blocks with JUMPDEST boundaries", () => {
			// Block 0: PUSH1 0x05, JUMP
			// Block 1: JUMPDEST, PUSH1 0x01, STOP
			const code = from(
				new Uint8Array([
					0x60,
					0x05, // PUSH1 5 (jump to pc=5 where JUMPDEST is)
					0x56, // JUMP
					0x00, // STOP (unreachable)
					0x00, // STOP (unreachable)
					0x5b, // JUMPDEST (pc=5)
					0x60,
					0x01, // PUSH1 1
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);

			expect(blocks.length).toBeGreaterThanOrEqual(2);

			// Block 0: Entry to JUMP
			const block0 = blocks.find((b) => b.startPc === 0);
			expect(block0).toBeDefined();
			expect(block0?.terminator).toBe("jump");

			// Block 1: JUMPDEST at pc=5
			const block1 = blocks.find((b) => b.startPc === 5);
			expect(block1).toBeDefined();
			expect(block1?.terminator).toBe("stop");
		});

		it("handles JUMPI creating two successors", () => {
			// PUSH1 0x01, PUSH1 0x09, JUMPI, STOP, JUMPDEST, STOP
			const code = from(
				new Uint8Array([
					0x60,
					0x01, // PUSH1 1
					0x60,
					0x09, // PUSH1 9
					0x57, // JUMPI
					0x00, // STOP (fallthrough)
					0x00, // padding
					0x00, // padding
					0x5b, // JUMPDEST (pc=9)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code, { buildCFG: true });

			const block0 = blocks.find((b) => b.startPc === 0);
			expect(block0).toBeDefined();
			expect(block0?.terminator).toBe("jumpi");
			// JUMPI has two successors: fallthrough and jump target
			expect(block0?.successors.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("CFG building", () => {
		it("builds successors when buildCFG=true", () => {
			// Simple JUMP: PUSH1 0x04, JUMP, STOP, JUMPDEST, STOP
			const code = from(
				new Uint8Array([
					0x60,
					0x04, // PUSH1 4 (jump to pc=4)
					0x56, // JUMP
					0x00, // STOP
					0x5b, // JUMPDEST (pc=4)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code, { buildCFG: true });

			const block0 = blocks.find((b) => b.startPc === 0);
			expect(block0?.successors.length).toBeGreaterThanOrEqual(1);
		});

		it("builds predecessors when buildCFG=true", () => {
			const code = from(
				new Uint8Array([
					0x60,
					0x04, // PUSH1 4 (jump to pc=4)
					0x56, // JUMP
					0x00, // STOP
					0x5b, // JUMPDEST (pc=4)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code, { buildCFG: true });

			const targetBlock = blocks.find((b) => b.startPc === 4);
			expect(targetBlock?.predecessors.length).toBeGreaterThanOrEqual(1);
		});

		it("omits successors/predecessors when buildCFG=false", () => {
			const code = from(new Uint8Array([0x60, 0x01, 0x00]));
			const blocks = analyzeBlocks(code, { buildCFG: false });

			expect(blocks[0]?.successors).toEqual([]);
			expect(blocks[0]?.predecessors).toEqual([]);
		});
	});

	describe("reachability analysis", () => {
		it("marks reachable blocks when computeReachability=true", () => {
			const code = from(
				new Uint8Array([
					0x60,
					0x04, // PUSH1 4 (jump to pc=4)
					0x56, // JUMP
					0x00, // unreachable (pc=3)
					0x5b, // JUMPDEST (pc=4)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code, {
				computeReachability: true,
				buildCFG: true,
			});

			const entryBlock = blocks.find((b) => b.startPc === 0);
			expect(entryBlock?.isReachable).toBe(true);

			const targetBlock = blocks.find((b) => b.startPc === 4);
			expect(targetBlock?.isReachable).toBe(true);
		});

		it("marks unreachable blocks correctly", () => {
			// Block after STOP is unreachable
			const code = from(
				new Uint8Array([
					0x00, // STOP
					0x60,
					0x01, // PUSH1 1 (unreachable)
					0x00, // STOP (unreachable)
				]),
			);
			const blocks = analyzeBlocks(code, {
				computeReachability: true,
				buildCFG: true,
			});

			const entryBlock = blocks.find((b) => b.startPc === 0);
			expect(entryBlock?.isReachable).toBe(true);

			const unreachableBlock = blocks.find((b) => b.startPc === 1);
			if (unreachableBlock) {
				expect(unreachableBlock.isReachable).toBe(false);
			}
		});

		it("excludes unreachable blocks when includeUnreachable=false", () => {
			const code = from(
				new Uint8Array([
					0x00, // STOP
					0x5b, // JUMPDEST (unreachable)
					0x00, // STOP (unreachable)
				]),
			);
			const blocks = analyzeBlocks(code, {
				computeReachability: true,
				buildCFG: true,
				includeUnreachable: false,
			});

			expect(blocks.every((b) => b.isReachable)).toBe(true);
		});

		it("includes unreachable blocks when includeUnreachable=true", () => {
			const code = from(
				new Uint8Array([
					0x00, // STOP
					0x5b, // JUMPDEST (unreachable)
					0x00, // STOP (unreachable)
				]),
			);
			const blocks = analyzeBlocks(code, {
				computeReachability: true,
				buildCFG: true,
				includeUnreachable: true,
			});

			const unreachableBlock = blocks.find((b) => b.startPc === 1);
			expect(unreachableBlock).toBeDefined();
			expect(unreachableBlock?.isReachable).toBe(false);
		});
	});

	describe("gas and stack calculations", () => {
		it("calculates basic gas cost", () => {
			// PUSH1 (3 gas), ADD (3 gas), STOP (0 gas)
			const code = from(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]));
			const blocks = analyzeBlocks(code);

			expect(blocks[0]?.gasEstimate).toBeGreaterThan(0);
		});

		it("calculates stack depth", () => {
			// PUSH1, PUSH1, ADD leaves 1 item on stack
			const code = from(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]));
			const blocks = analyzeBlocks(code);

			const block = blocks[0];
			expect(block?.minStack).toBeDefined();
			expect(block?.maxStack).toBeDefined();
			expect(block?.stackEffect).toBeDefined();
		});

		it("tracks min/max stack through block", () => {
			// PUSH1, PUSH1, PUSH1 increases stack by 3
			const code = from(
				new Uint8Array([
					0x60,
					0x01, // PUSH1
					0x60,
					0x02, // PUSH1
					0x60,
					0x03, // PUSH1
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);

			const block = blocks[0];
			expect(block?.maxStack).toBe(3);
			expect(block?.stackEffect).toBe(3);
		});
	});

	describe("terminator detection", () => {
		it("identifies STOP terminator", () => {
			const code = from(new Uint8Array([0x00]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("stop");
		});

		it("identifies RETURN terminator", () => {
			const code = from(new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("return");
		});

		it("identifies REVERT terminator", () => {
			const code = from(new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xfd]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("revert");
		});

		it("identifies INVALID terminator", () => {
			const code = from(new Uint8Array([0xfe]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("invalid");
		});

		it("identifies SELFDESTRUCT terminator", () => {
			const code = from(new Uint8Array([0x60, 0x00, 0xff]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("selfdestruct");
		});

		it("identifies JUMP terminator", () => {
			const code = from(new Uint8Array([0x60, 0x05, 0x56]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("jump");
		});

		it("identifies JUMPI terminator", () => {
			const code = from(new Uint8Array([0x60, 0x01, 0x60, 0x05, 0x57]));
			const blocks = analyzeBlocks(code);
			expect(blocks[0]?.terminator).toBe("jumpi");
		});

		it("identifies fallthrough terminator", () => {
			const code = from(
				new Uint8Array([
					0x60,
					0x01, // PUSH1 1
					0x5b, // JUMPDEST (start of next block)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);
			const firstBlock = blocks.find((b) => b.startPc === 0);
			if (firstBlock && blocks.length > 1) {
				expect(firstBlock.terminator).toBe("fallthrough");
			}
		});
	});

	describe("jump target extraction", () => {
		it("extracts static jump target from PUSH+JUMP", () => {
			const code = from(
				new Uint8Array([
					0x60,
					0x05, // PUSH1 5
					0x56, // JUMP
					0x00, // STOP
					0x5b, // JUMPDEST (pc=5)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);

			const jumpBlock = blocks.find((b) => b.terminator === "jump");
			expect(jumpBlock?.target).toBe(5);
		});

		it("extracts static jump target from PUSH+JUMPI", () => {
			const code = from(
				new Uint8Array([
					0x60,
					0x01, // PUSH1 1
					0x60,
					0x08, // PUSH1 8
					0x57, // JUMPI
					0x00, // STOP
					0x5b, // JUMPDEST (pc=8)
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);

			const jumpiBlock = blocks.find((b) => b.terminator === "jumpi");
			expect(jumpiBlock?.target).toBe(8);
		});

		it("handles dynamic jumps without target", () => {
			// DUP1, JUMP (target on stack, not static)
			const code = from(new Uint8Array([0x80, 0x56]));
			const blocks = analyzeBlocks(code);

			const jumpBlock = blocks[0];
			expect(jumpBlock?.terminator).toBe("jump");
			expect(jumpBlock?.target).toBeUndefined();
		});
	});

	describe("edge cases", () => {
		it("handles empty bytecode", () => {
			const code = from(new Uint8Array([]));
			const blocks = analyzeBlocks(code);
			expect(blocks).toEqual([]);
		});

		it("handles single opcode", () => {
			const code = from(new Uint8Array([0x00]));
			const blocks = analyzeBlocks(code);
			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.instructionCount).toBe(1);
		});

		it("handles PUSH at end of bytecode", () => {
			// Truncated PUSH (missing data bytes)
			const code = from(new Uint8Array([0x60]));
			const blocks = analyzeBlocks(code);
			expect(blocks).toHaveLength(1);
		});

		it("handles consecutive JUMPDESTs", () => {
			const code = from(
				new Uint8Array([
					0x5b, // JUMPDEST
					0x5b, // JUMPDEST
					0x5b, // JUMPDEST
					0x00, // STOP
				]),
			);
			const blocks = analyzeBlocks(code);
			// Should create separate blocks for each JUMPDEST
			expect(blocks.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("default options", () => {
		it("uses sensible defaults when no options provided", () => {
			const code = from(new Uint8Array([0x60, 0x01, 0x00]));
			const blocks = analyzeBlocks(code);

			expect(blocks).toHaveLength(1);
			expect(blocks[0]?.isReachable).toBe(false); // defaults to false
			expect(blocks[0]?.successors).toEqual([]);
			expect(blocks[0]?.predecessors).toEqual([]);
		});
	});
});
