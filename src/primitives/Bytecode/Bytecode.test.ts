import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Opcode from "../Opcode/index.js";
import { Bytecode } from "./index.js";

describe("Bytecode", () => {
	describe("1. Basic Analysis", () => {
		it("analyze() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(0);
			expect(analysis.jumpDestinations.size).toBe(0);
		});

		it("analyze() - simple contract (PUSH1, RETURN)", () => {
			// PUSH1 0x00, PUSH1 0x00, RETURN
			const code = Bytecode(new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3]));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(3);
			expect(analysis.instructions[0].opcode).toBe(0x60); // PUSH1
			expect(analysis.instructions[1].opcode).toBe(0x60); // PUSH1
			expect(analysis.instructions[2].opcode).toBe(0xf3); // RETURN
		});

		it("analyze() - contract with jumps", () => {
			// PUSH1 0x05, JUMP, STOP, STOP, JUMPDEST, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x05, 0x56, 0x00, 0x00, 0x5b, 0x00]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.jumpDestinations.has(5)).toBe(true);
			expect(analysis.instructions).toHaveLength(6); // PUSH1, JUMP, STOP, STOP, JUMPDEST, STOP
		});

		it("analyze() - complex contract with all opcode types", () => {
			// PUSH1 0x01, ADD, DUP1, SWAP1, POP, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x01, 0x80, 0x90, 0x50, 0x00]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(6);
		});

		it("analyze() - metadata detection", () => {
			// Simple code + metadata marker
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00, 0x00, 0x29]));
			const hasMetadata = code.hasMetadata();
			expect(typeof hasMetadata).toBe("boolean");
		});

		it("analyze() - constructor vs runtime code", () => {
			// Constructor that returns runtime code
			// PUSH1 0x03, PUSH1 0x0c, PUSH1 0x00, CODECOPY, PUSH1 0x03, PUSH1 0x00, RETURN, PUSH1 0x01, STOP
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x03, 0x60, 0x0c, 0x60, 0x00, 0x39, 0x60, 0x03, 0x60, 0x00,
					0xf3, 0x60, 0x01, 0x00,
				]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions.length).toBeGreaterThan(0);
		});

		it("analyze() - invalid bytecode (truncated PUSH)", () => {
			const code = Bytecode(new Uint8Array([0x60])); // PUSH1 with no data
			const analysis = code.analyze();
			expect(analysis.valid).toBe(false);
		});

		it("analyze() - all STOP opcodes", () => {
			const code = Bytecode(new Uint8Array([0x00, 0x00, 0x00]));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(3);
		});

		it("analyze() - comprehensive bytecode with metadata", () => {
			// Real-world-ish bytecode: PUSH1, MSTORE, RETURN + metadata
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x80, 0x60, 0x40, 0x52, 0x60, 0x00, 0x80, 0xf3, 0xa2, 0x64,
					0x69, 0x70, 0x66, 0x73, 0x58, 0x22, 0x00, 0x33,
				]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(code.hasMetadata()).toBe(true);
		});

		it("analyze() - contract with all terminator types", () => {
			// STOP, RETURN, REVERT, INVALID
			const code = Bytecode(
				new Uint8Array([
					0x00, // STOP
					0x60,
					0x00,
					0x60,
					0x00,
					0xf3, // PUSH1 0, PUSH1 0, RETURN
					0x60,
					0x00,
					0x60,
					0x00,
					0xfd, // PUSH1 0, PUSH1 0, REVERT
					0xfe, // INVALID
				]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
		});
	});

	describe("2. Instruction Parsing", () => {
		it("parseInstructions() - all PUSH variants (PUSH1-PUSH32)", () => {
			// Test PUSH1, PUSH2, PUSH3
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x01, // PUSH1 0x01
					0x61,
					0x01,
					0x02, // PUSH2 0x0102
					0x62,
					0x01,
					0x02,
					0x03, // PUSH3 0x010203
				]),
			);
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(3);
			expect(instructions[0].pushData).toEqual(new Uint8Array([0x01]));
			expect(instructions[1].pushData).toEqual(new Uint8Array([0x01, 0x02]));
			expect(instructions[2].pushData).toEqual(
				new Uint8Array([0x01, 0x02, 0x03]),
			);
		});

		it("parseInstructions() - PUSH32", () => {
			const pushData = new Uint8Array(32).fill(0xff);
			const code = Bytecode(new Uint8Array([0x7f, ...pushData]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(1);
			expect(instructions[0].opcode).toBe(0x7f); // PUSH32
			expect(instructions[0].pushData).toEqual(pushData);
		});

		it("parseInstructions() - PUSH with insufficient data (truncated)", () => {
			const code = Bytecode(new Uint8Array([0x60])); // PUSH1 with no data
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(1);
			expect(instructions[0].pushData).toHaveLength(0); // Truncated
		});

		it("parseInstructions() - all basic opcodes", () => {
			// STOP, ADD, MUL, SUB, DIV
			const code = Bytecode(new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(5);
			expect(instructions[0].opcode).toBe(0x00);
			expect(instructions[1].opcode).toBe(0x01);
			expect(instructions[2].opcode).toBe(0x02);
		});

		it("parseInstructions() - invalid opcodes (0xfe)", () => {
			const code = Bytecode(new Uint8Array([0xfe])); // INVALID
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(1);
			expect(instructions[0].opcode).toBe(0xfe);
		});

		it("parseInstructions() - unknown future opcodes", () => {
			// Use undefined opcodes
			const code = Bytecode(new Uint8Array([0x0c, 0x0d, 0x0e]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(3);
		});

		it("parseInstructions() - sequential execution", () => {
			// Verify position tracking: PUSH1 0x01, PUSH1 0x02, ADD
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const instructions = code.parseInstructions();
			expect(instructions[0].position).toBe(0);
			expect(instructions[1].position).toBe(2);
			expect(instructions[2].position).toBe(4);
		});

		it("parseInstructions() - jump destinations", () => {
			// PUSH1 0x05, JUMP, INVALID, JUMPDEST, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x05, 0x56, 0xfe, 0xfe, 0x5b, 0x00]),
			);
			const instructions = code.parseInstructions();
			const jumpdest = instructions.find((i) => i.opcode === 0x5b);
			expect(jumpdest).toBeDefined();
			expect(jumpdest?.position).toBe(5);
		});

		it("parseInstructions() - mixed PUSH and non-PUSH", () => {
			// PUSH1 0x01, DUP1, PUSH2 0x0100, SWAP1
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x80, 0x61, 0x01, 0x00, 0x90]),
			);
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(4);
			expect(instructions[0].pushData).toBeDefined();
			expect(instructions[1].pushData).toBeUndefined();
			expect(instructions[2].pushData).toBeDefined();
		});

		it("parseInstructions() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(0);
		});

		it("parseInstructions() - DUP and SWAP operations", () => {
			// DUP1, DUP2, SWAP1, SWAP2
			const code = Bytecode(new Uint8Array([0x80, 0x81, 0x90, 0x91]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(4);
			expect(instructions.every((i) => i.pushData === undefined)).toBe(true);
		});

		it("parseInstructions() - LOG operations", () => {
			// LOG0, LOG1, LOG2, LOG3, LOG4
			const code = Bytecode(new Uint8Array([0xa0, 0xa1, 0xa2, 0xa3, 0xa4]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(5);
		});

		it("parseInstructions() - CREATE and CALL operations", () => {
			// CREATE, CALL, CALLCODE, DELEGATECALL, CREATE2, STATICCALL
			const code = Bytecode(
				new Uint8Array([0xf0, 0xf1, 0xf2, 0xf4, 0xf5, 0xfa]),
			);
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(6);
		});

		it("parseInstructions() - memory operations", () => {
			// MLOAD, MSTORE, MSTORE8
			const code = Bytecode(new Uint8Array([0x51, 0x52, 0x53]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(3);
		});

		it("parseInstructions() - storage operations", () => {
			// SLOAD, SSTORE
			const code = Bytecode(new Uint8Array([0x54, 0x55]));
			const instructions = code.parseInstructions();
			expect(instructions).toHaveLength(2);
		});
	});

	describe("3. Block Analysis", () => {
		it("analyzeBlocks() - linear code blocks", () => {
			// Simple linear code: PUSH1 0x01, PUSH1 0x02, ADD, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]),
			);
			const blocks = code.analyzeBlocks();
			expect(blocks).toHaveLength(1);
			expect(blocks[0].startPc).toBe(0);
		});

		it("analyzeBlocks() - conditional branches (JUMPI)", () => {
			// PUSH1 0x08, PUSH1 0x01, JUMPI, STOP, INVALID, JUMPDEST, STOP
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x08, 0x60, 0x01, 0x57, 0x00, 0xfe, 0xfe, 0x5b, 0x00,
				]),
			);
			const blocks = code.analyzeBlocks({ buildCFG: true });
			expect(blocks.length).toBeGreaterThan(1);
			const jumpiBlock = blocks.find((b) => b.terminator === "jumpi");
			expect(jumpiBlock).toBeDefined();
		});

		it("analyzeBlocks() - unconditional jumps (JUMP)", () => {
			// PUSH1 0x05, JUMP, INVALID, JUMPDEST, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x05, 0x56, 0xfe, 0xfe, 0x5b, 0x00]),
			);
			const blocks = code.analyzeBlocks({ buildCFG: true });
			const jumpBlock = blocks.find((b) => b.terminator === "jump");
			expect(jumpBlock).toBeDefined();
			expect(jumpBlock?.target).toBe(5);
		});

		it("analyzeBlocks() - multiple entry points", () => {
			// JUMPDEST, PUSH1 0x01, JUMPDEST, PUSH1 0x02, STOP
			const code = Bytecode(
				new Uint8Array([0x5b, 0x60, 0x01, 0x5b, 0x60, 0x02, 0x00]),
			);
			const blocks = code.analyzeBlocks();
			expect(blocks.length).toBeGreaterThan(1);
		});

		it("analyzeBlocks() - unreachable code detection", () => {
			// PUSH1 0x00, RETURN, INVALID (unreachable)
			const code = Bytecode(
				new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3, 0xfe]),
			);
			const blocks = code.analyzeBlocks({
				computeReachability: true,
				buildCFG: true,
			});
			const unreachable = blocks.filter((b) => !b.isReachable);
			expect(unreachable.length).toBeGreaterThan(0);
		});

		it("analyzeBlocks() - block boundaries", () => {
			// PUSH1 0x01, JUMPDEST, PUSH1 0x02, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x5b, 0x60, 0x02, 0x00]),
			);
			const blocks = code.analyzeBlocks();
			expect(blocks.length).toBeGreaterThan(0);
			expect(blocks[0].endPc).toBeGreaterThan(blocks[0].startPc);
		});

		it("analyzeBlocks() - JUMPDEST identification", () => {
			// Multiple JUMPDESTs
			const code = Bytecode(
				new Uint8Array([0x5b, 0x00, 0x5b, 0x00, 0x5b, 0x00]),
			);
			const blocks = code.analyzeBlocks();
			expect(blocks.length).toBeGreaterThanOrEqual(3);
		});

		it("analyzeBlocks() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const blocks = code.analyzeBlocks();
			expect(blocks).toHaveLength(0);
		});

		it("analyzeBlocks() - CFG construction", () => {
			// PUSH1 0x05, JUMPI, STOP, JUMPDEST, STOP
			const code = Bytecode(
				new Uint8Array([0x60, 0x05, 0x57, 0x00, 0x00, 0x5b, 0x00]),
			);
			const blocks = code.analyzeBlocks({ buildCFG: true });
			expect(blocks.some((b) => b.successors.length > 0)).toBe(true);
		});

		it("analyzeBlocks() - reachability computation", () => {
			// Reachable: PUSH1 0x01, STOP
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const blocks = code.analyzeBlocks({
				computeReachability: true,
				buildCFG: true,
			});
			expect(blocks[0].isReachable).toBe(true);
		});

		it("analyzeBlocks() - filter unreachable blocks", () => {
			// STOP, INVALID (unreachable)
			const code = Bytecode(new Uint8Array([0x00, 0xfe]));
			const allBlocks = code.analyzeBlocks({
				computeReachability: true,
				buildCFG: true,
				includeUnreachable: true,
			});
			const reachableBlocks = code.analyzeBlocks({
				computeReachability: true,
				buildCFG: true,
				includeUnreachable: false,
			});
			expect(reachableBlocks.length).toBeLessThanOrEqual(allBlocks.length);
		});

		it("analyzeBlocks() - complex control flow", () => {
			// Dispatcher-like pattern: multiple conditional jumps
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x0a,
					0x57, // PUSH1 10, JUMPI
					0x60,
					0x10,
					0x57, // PUSH1 16, JUMPI
					0x00, // STOP
					0x5b,
					0x60,
					0x01,
					0x00, // JUMPDEST, PUSH1 1, STOP
					0x5b,
					0x60,
					0x02,
					0x00, // JUMPDEST, PUSH1 2, STOP
				]),
			);
			const blocks = code.analyzeBlocks({ buildCFG: true });
			expect(blocks.length).toBeGreaterThan(2);
		});
	});

	describe("4. Jump Destination Analysis", () => {
		it("analyzeJumpDestinations() - valid JUMPDEST opcodes", () => {
			// JUMPDEST at position 0 and 2
			const code = Bytecode(new Uint8Array([0x5b, 0x00, 0x5b, 0x00]));
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(0)).toBe(true);
			expect(jumpDests.has(2)).toBe(true);
		});

		it("analyzeJumpDestinations() - JUMPDEST inside PUSH data (invalid)", () => {
			// PUSH2 0x5b00 - the 0x5b is inside PUSH data, not a JUMPDEST
			const code = Bytecode(new Uint8Array([0x61, 0x5b, 0x00, 0x00]));
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(1)).toBe(false); // Position 1 is inside PUSH data
		});

		it("analyzeJumpDestinations() - multiple JUMPDEST", () => {
			const code = Bytecode(new Uint8Array([0x5b, 0x5b, 0x5b, 0x00]));
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(0)).toBe(true);
			expect(jumpDests.has(1)).toBe(true);
			expect(jumpDests.has(2)).toBe(true);
		});

		it("analyzeJumpDestinations() - no JUMPDEST (sequential code)", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]),
			);
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.size).toBe(0);
		});

		it("analyzeJumpDestinations() - jump table patterns", () => {
			// Multiple JUMPDESTs simulating a jump table
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x05,
					0x56, // PUSH1 5, JUMP
					0xfe,
					0xfe, // INVALID INVALID
					0x5b,
					0x00, // JUMPDEST, STOP (position 5)
					0x5b,
					0x00, // JUMPDEST, STOP (position 7)
					0x5b,
					0x00, // JUMPDEST, STOP (position 9)
				]),
			);
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.size).toBeGreaterThanOrEqual(3);
		});

		it("analyzeJumpDestinations() - dispatcher patterns", () => {
			// Function dispatcher with multiple JUMPDESTs
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x04,
					0x35, // PUSH1 4, CALLDATALOAD (selector)
					0x5b, // JUMPDEST (position 3)
					0x60,
					0x08,
					0x57, // PUSH1 8, JUMPI
					0x00, // STOP
					0x5b,
					0x00, // JUMPDEST, STOP (position 8)
				]),
			);
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(3)).toBe(true);
			expect(jumpDests.has(8)).toBe(true);
		});

		it("analyzeJumpDestinations() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.size).toBe(0);
		});

		it("analyzeJumpDestinations() - JUMPDEST at end", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00, 0x5b]));
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(3)).toBe(true);
		});

		it("analyzeJumpDestinations() - PUSH32 with JUMPDEST bytes", () => {
			// PUSH32 containing 0x5b bytes
			const pushData = new Uint8Array(32).fill(0x5b);
			const code = Bytecode(new Uint8Array([0x7f, ...pushData, 0x5b, 0x00]));
			const jumpDests = code.analyzeJumpDestinations();
			// Only the last JUMPDEST at position 33 should be valid
			expect(jumpDests.has(33)).toBe(true);
			// Positions 1-32 are inside PUSH data
			for (let i = 1; i <= 32; i++) {
				expect(jumpDests.has(i)).toBe(false);
			}
		});

		it("analyzeJumpDestinations() - alternating JUMPDEST and opcodes", () => {
			const code = Bytecode(
				new Uint8Array([0x5b, 0x00, 0x5b, 0x01, 0x5b, 0x02]),
			);
			const jumpDests = code.analyzeJumpDestinations();
			expect(jumpDests.has(0)).toBe(true);
			expect(jumpDests.has(2)).toBe(true);
			expect(jumpDests.has(4)).toBe(true);
		});
	});

	describe("5. Gas Analysis", () => {
		it("analyzeGas() - simple operations", () => {
			// PUSH1, ADD, STOP
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - complex operations", () => {
			// KECCAK256, SLOAD, SSTORE
			const code = Bytecode(new Uint8Array([0x20, 0x54, 0x55]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - loops (bounded gas estimation)", () => {
			// Simple loop simulation: JUMPDEST, PUSH1 0x00, JUMPI
			const code = Bytecode(new Uint8Array([0x5b, 0x60, 0x00, 0x57]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - CALL operations", () => {
			// CALL opcode
			const code = Bytecode(new Uint8Array([0xf1]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - CREATE operations", () => {
			// CREATE, CREATE2
			const code = Bytecode(new Uint8Array([0xf0, 0xf5]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - memory expansion costs", () => {
			// MLOAD, MSTORE operations
			const code = Bytecode(new Uint8Array([0x51, 0x52]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
		});

		it("analyzeGas() - storage operations", () => {
			// SLOAD, SSTORE
			const code = Bytecode(new Uint8Array([0x54, 0x55]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBeGreaterThan(0n);
			// expensive array may be empty if threshold is high
			expect(Array.isArray(gasAnalysis.expensive)).toBe(true);
		});

		it("analyzeGas() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.total).toBe(0n);
		});
	});

	describe("6. Stack Analysis", () => {
		it("analyzeStack() - stack underflow detection", () => {
			// ADD without items on stack
			const code = Bytecode(new Uint8Array([0x01]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(false);
			expect(stackAnalysis.issues.some((i) => i.type === "underflow")).toBe(
				true,
			);
		});

		it("analyzeStack() - stack overflow detection (>1024)", () => {
			// Would need many PUSH operations
			const pushes = new Array(1030).fill([0x60, 0x00]).flat();
			const code = Bytecode(new Uint8Array(pushes));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.maxDepth).toBeGreaterThan(1024);
			expect(stackAnalysis.valid).toBe(false);
		});

		it("analyzeStack() - stack balance validation", () => {
			// PUSH1, PUSH1, ADD (2-2+1=1 final depth)
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
		});

		it("analyzeStack() - PUSH/POP patterns", () => {
			// PUSH1, POP
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x50]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
		});

		it("analyzeStack() - DUP operations", () => {
			// PUSH1, DUP1
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x80]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
			expect(stackAnalysis.maxDepth).toBeGreaterThanOrEqual(2);
		});

		it("analyzeStack() - SWAP operations", () => {
			// PUSH1, PUSH1, SWAP1
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x90]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
		});

		it("analyzeStack() - stack depth tracking", () => {
			// PUSH1, PUSH1, PUSH1 (depth=3)
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x60, 0x03]),
			);
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.maxDepth).toBe(3);
		});

		it("analyzeStack() - complex stack manipulation", () => {
			// PUSH1, PUSH1, ADD, PUSH1, MUL
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x60, 0x03, 0x02]),
			);
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
		});

		it("analyzeStack() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
			expect(stackAnalysis.maxDepth).toBe(0);
		});

		it("analyzeStack() - all DUP variants", () => {
			// Need 16 items for DUP16
			const setup = new Array(16).fill([0x60, 0x00]).flat(); // 16 PUSH1 0x00
			const code = Bytecode(new Uint8Array([...setup, 0x8f])); // DUP16
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.valid).toBe(true);
		});
	});

	describe("7. Formatting & Display", () => {
		it("formatInstruction() - single instruction formatting", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01]));
			const instructions = code.parseInstructions();
			const formatted = Bytecode.formatInstruction(instructions[0]);
			expect(typeof formatted).toBe("string");
			expect(formatted.length).toBeGreaterThan(0);
		});

		it("formatInstructions() - multiple instructions", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const formatted = code.formatInstructions();
			expect(Array.isArray(formatted)).toBe(true);
			expect(formatted.length).toBeGreaterThan(0);
		});

		it("prettyPrint() - pretty-printed disassembly", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]),
			);
			const pretty = code.prettyPrint();
			expect(typeof pretty).toBe("string");
			expect(pretty.length).toBeGreaterThan(0);
		});

		it("prettyPrint() - with options", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const pretty = code.prettyPrint({
				showGas: true,
				showStack: true,
				lineNumbers: true,
			});
			expect(typeof pretty).toBe("string");
		});

		it("formatInstruction() - PUSH data display", () => {
			const code = Bytecode(new Uint8Array([0x60, 0xff]));
			const instructions = code.parseInstructions();
			const formatted = Bytecode.formatInstruction(instructions[0]);
			expect(formatted).toContain("PUSH1");
		});

		it("formatInstructions() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const formatted = code.formatInstructions();
			expect(formatted).toHaveLength(0);
		});

		it("prettyPrint() - complex bytecode", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x5b, 0x00]),
			);
			const pretty = code.prettyPrint({ showBlocks: true });
			expect(typeof pretty).toBe("string");
		});

		it("formatInstruction() - various opcode names", () => {
			const opcodes = [0x00, 0x01, 0x20, 0x51, 0x54, 0xf3];
			for (const opcode of opcodes) {
				const code = Bytecode(new Uint8Array([opcode]));
				const instructions = code.parseInstructions();
				const formatted = Bytecode.formatInstruction(instructions[0]);
				expect(typeof formatted).toBe("string");
			}
		});
	});

	describe("8. Metadata Handling", () => {
		it("hasMetadata() - metadata detection", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00, 0x00, 0x29]));
			const has = code.hasMetadata();
			expect(typeof has).toBe("boolean");
		});

		it("hasMetadata() - Solidity metadata pattern", () => {
			// Typical Solidity metadata end: 0x00 0x33
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x80, 0x60, 0x40, 0x52, 0xa2, 0x64, 0x69, 0x70, 0x66, 0x73,
					0x00, 0x33,
				]),
			);
			const has = code.hasMetadata();
			expect(has).toBe(true);
		});

		it("hasMetadata() - Vyper metadata", () => {
			// Vyper uses similar pattern
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00, 0x00, 0x30]));
			const has = code.hasMetadata();
			expect(typeof has).toBe("boolean");
		});

		it("stripMetadata() - metadata removal", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x00, 0xa2, 0x64, 0x00, 0x33]),
			);
			const stripped = code.stripMetadata();
			expect(stripped).toBeInstanceOf(Uint8Array);
			expect(stripped.length).toBeLessThanOrEqual(code.length);
		});

		it("extractRuntime() - runtime code extraction", () => {
			// Constructor that copies runtime code
			const code = Bytecode(
				new Uint8Array([
					0x60, 0x03, 0x60, 0x0c, 0x60, 0x00, 0x39, 0x60, 0x03, 0x60, 0x00,
					0xf3, 0x60, 0x01, 0x00,
				]),
			);
			const runtime = code.extractRuntime();
			expect(runtime).toBeInstanceOf(Uint8Array);
		});

		it("stripMetadata() - no metadata", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const stripped = code.stripMetadata();
			expect(stripped.length).toBe(code.length);
		});

		it("hasMetadata() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const has = code.hasMetadata();
			expect(has).toBe(false);
		});
	});

	describe("9. Validation", () => {
		it("validate() - valid bytecode", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]),
			);
			const valid = code.validate();
			expect(valid).toBe(true);
		});

		it("validate() - truncated PUSH data", () => {
			const code = Bytecode(new Uint8Array([0x60])); // PUSH1 with no data
			const valid = code.validate();
			expect(valid).toBe(false);
		});

		it("validate() - invalid opcode sequences", () => {
			// PUSH2 with only 1 byte
			const code = Bytecode(new Uint8Array([0x61, 0x01]));
			const valid = code.validate();
			expect(valid).toBe(false);
		});

		it("validate() - unreachable code warnings", () => {
			// STOP, INVALID (unreachable but still valid bytecode structurally)
			const code = Bytecode(new Uint8Array([0x00, 0xfe]));
			const valid = code.validate();
			expect(valid).toBe(true); // Structurally valid
		});

		it("validate() - jump to non-JUMPDEST", () => {
			// PUSH1 0x03, JUMP, STOP (position 3 is not JUMPDEST)
			const code = Bytecode(new Uint8Array([0x60, 0x03, 0x56, 0x00]));
			const valid = code.validate();
			expect(valid).toBe(true); // Structurally valid
			// Note: Jump target validation is runtime concern
		});

		it("validate() - empty bytecode", () => {
			const code = Bytecode(new Uint8Array([]));
			const valid = code.validate();
			expect(valid).toBe(true);
		});
	});

	describe("10. Utilities", () => {
		it("scan() - linear scan", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const scanned = Array.from(code.scan());
			expect(scanned.length).toBeGreaterThan(0);
		});

		it("getBlock() - get basic block", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x5b, 0x60, 0x02, 0x00]),
			);
			const block = code.getBlock(0);
			expect(block).toBeDefined();
		});

		it("getNextPc() - next PC calculation", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const nextPc = code.getNextPc(0);
			expect(nextPc).toBe(2); // PUSH1 takes 2 bytes
		});

		it("getPushSize() - PUSH data size", () => {
			const push1Size = Bytecode.getPushSize(0x60);
			const push2Size = Bytecode.getPushSize(0x61);
			const push32Size = Bytecode.getPushSize(0x7f);
			expect(push1Size).toBe(1);
			expect(push2Size).toBe(2);
			expect(push32Size).toBe(32);
		});

		it("isPush() - PUSH opcode detection", () => {
			expect(Bytecode.isPush(0x60)).toBe(true); // PUSH1
			expect(Bytecode.isPush(0x7f)).toBe(true); // PUSH32
			expect(Bytecode.isPush(0x00)).toBe(false); // STOP
		});

		it("isTerminator() - terminating opcode", () => {
			expect(Bytecode.isTerminator(0x00)).toBe(true); // STOP
			expect(Bytecode.isTerminator(0xf3)).toBe(true); // RETURN
			expect(Bytecode.isTerminator(0xfd)).toBe(true); // REVERT
			expect(Bytecode.isTerminator(0xfe)).toBe(true); // INVALID
			expect(Bytecode.isTerminator(0x01)).toBe(false); // ADD
		});

		it("isValidJumpDest() - valid jump destination check", () => {
			const code = Bytecode(new Uint8Array([0x5b, 0x00, 0x60, 0x5b, 0x00]));
			expect(code.isValidJumpDest(0)).toBe(true); // JUMPDEST at 0
			// Position 3 is inside PUSH1 data, so not valid
		});

		it("hash() - bytecode hashing", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const hash = code.hash();
			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("scan() - with options", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const scanned = Array.from(code.scan({ withGas: true, withStack: true }));
			expect(scanned.length).toBeGreaterThan(0);
		});

		it("getNextPc() - various opcodes", () => {
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x01, // PUSH1 at 0, next is 2
					0x61,
					0x01,
					0x02, // PUSH2 at 2, next is 5
					0x00, // STOP at 5, next would be 6 (EOF)
				]),
			);
			expect(code.getNextPc(0)).toBe(2);
			expect(code.getNextPc(2)).toBe(5);
			// Position 5 is last byte, next would be EOF (undefined)
			expect(code.getNextPc(5)).toBeUndefined();
		});
	});

	describe("11. Edge Cases", () => {
		it("empty bytecode (valid - returns immediately)", () => {
			const code = Bytecode(new Uint8Array([]));
			expect(code.validate()).toBe(true);
			expect(code.analyze().valid).toBe(true);
			expect(code.parseInstructions()).toHaveLength(0);
		});

		it("single STOP opcode", () => {
			const code = Bytecode(new Uint8Array([0x00]));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(1);
		});

		it("maximum size bytecode (24KB limit)", () => {
			// EIP-170: contract size limit is 24576 bytes
			const maxSize = 24576;
			const largeCode = new Uint8Array(maxSize).fill(0x00);
			const code = Bytecode(largeCode);
			expect(code.validate()).toBe(true);
			expect(code.length).toBe(maxSize);
		});

		it("all zeros bytecode", () => {
			const code = Bytecode(new Uint8Array(100).fill(0x00));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(100);
		});

		it("all 0xFF bytecode", () => {
			const code = Bytecode(new Uint8Array(100).fill(0xff));
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
		});

		it("bytecode with only PUSH data", () => {
			// PUSH32 * 3
			const code = Bytecode(
				new Uint8Array([
					0x7f,
					...new Uint8Array(32).fill(0xaa),
					0x7f,
					...new Uint8Array(32).fill(0xbb),
					0x7f,
					...new Uint8Array(32).fill(0xcc),
				]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(3);
		});

		it("bytecode ending with PUSH (invalid)", () => {
			// PUSH32 at end with insufficient data
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x00, 0x7f, 0x01, 0x02, 0x03]),
			);
			const valid = code.validate();
			expect(valid).toBe(false);
		});

		it("alternating PUSH and non-PUSH", () => {
			// PUSH1, ADD, PUSH1, MUL, PUSH1, SUB
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x01, 0x60, 0x02, 0x02, 0x60, 0x03, 0x03]),
			);
			const analysis = code.analyze();
			expect(analysis.valid).toBe(true);
			expect(analysis.instructions).toHaveLength(6);
		});

		it("size() - bytecode size", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			expect(code.size()).toBe(3);
		});

		it("equals() - bytecode equality", () => {
			const code1 = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const code2 = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const code3 = Bytecode(new Uint8Array([0x60, 0x02, 0x00]));
			expect(code1.equals(code2)).toBe(true);
			expect(code1.equals(code3)).toBe(false);
		});
	});

	describe("12. Additional Coverage", () => {
		it("toHex() - convert to hex string", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			const hex = code.toHex();
			expect(typeof hex).toBe("string");
			expect(hex).toBe("0x600100");
		});

		it("fromHex() - construct from hex", () => {
			const code = Bytecode.fromHex("0x600100");
			expect(code).toBeInstanceOf(Uint8Array);
			expect(code.length).toBe(3);
		});

		it("from() - construct from various inputs", () => {
			const fromHex = Bytecode("0x600100");
			const fromArray = Bytecode([0x60, 0x01, 0x00]);
			const fromUint8Array = Bytecode(new Uint8Array([0x60, 0x01, 0x00]));
			expect(fromHex.length).toBe(3);
			expect(fromArray.length).toBe(3);
			expect(fromUint8Array.length).toBe(3);
		});

		it("detectFusions() - detect fusion patterns", () => {
			// Some EVM implementations optimize certain opcode sequences
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const fusions = code.detectFusions();
			expect(Array.isArray(fusions)).toBe(true);
		});

		it("toAbi() - extract ABI from bytecode", () => {
			// Bytecode with function selector pattern
			const code = Bytecode(
				new Uint8Array([
					0x60,
					0x04,
					0x35, // PUSH1 4, CALLDATALOAD (load selector)
					0x63,
					0x12,
					0x34,
					0x56,
					0x78, // PUSH4 0x12345678 (selector)
					0x14, // EQ
					0x00, // STOP
				]),
			);
			const abi = code.toAbi();
			expect(Array.isArray(abi)).toBe(true);
		});

		it("analyzeBlocks() - block instruction count", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01, 0x00]),
			);
			const blocks = code.analyzeBlocks();
			expect(blocks[0].instructionCount).toBeGreaterThan(0);
		});

		it("analyzeBlocks() - block gas estimate", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
			const blocks = code.analyzeBlocks();
			expect(blocks[0].gasEstimate).toBeGreaterThanOrEqual(0);
		});

		it("analyzeBlocks() - block stack metrics", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]));
			const blocks = code.analyzeBlocks();
			expect(blocks[0].minStack).toBeGreaterThanOrEqual(0);
			expect(blocks[0].maxStack).toBeGreaterThanOrEqual(0);
		});

		it("analyzeGas() - instruction gas breakdown", () => {
			const code = Bytecode(new Uint8Array([0x60, 0x01, 0x01, 0x00]));
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.byInstruction.length).toBeGreaterThan(0);
		});

		it("analyzeGas() - block gas breakdown", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x5b, 0x60, 0x02, 0x00]),
			);
			const gasAnalysis = code.analyzeGas();
			expect(gasAnalysis.byBlock.length).toBeGreaterThan(0);
		});

		it("analyzeStack() - block stack info", () => {
			const code = Bytecode(
				new Uint8Array([0x60, 0x01, 0x5b, 0x60, 0x02, 0x00]),
			);
			const stackAnalysis = code.analyzeStack();
			expect(stackAnalysis.byBlock.length).toBeGreaterThan(0);
		});
	});
});
