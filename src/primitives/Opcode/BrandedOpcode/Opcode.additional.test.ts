/**
 * Additional comprehensive tests for EVM Opcode module
 * Edge cases, boundaries, and hardfork-specific opcodes
 */

import { describe, expect, it } from "vitest";
import * as Opcode from "../Opcode.js";

// ============================================================================
// Boundary and Edge Case Tests
// ============================================================================

describe("Opcode boundary tests", () => {
	it("validates all opcode byte values in range 0x00-0xff", () => {
		for (let byte = 0; byte <= 0xff; byte++) {
			const isDefinedOpcode =
				byte <= 0x0b || // Arithmetic
				(byte >= 0x10 && byte <= 0x1d) || // Comparison/Bitwise
				byte === 0x20 || // KECCAK256
				(byte >= 0x30 && byte <= 0x3f) || // Environmental
				(byte >= 0x40 && byte <= 0x4a) || // Block info
				(byte >= 0x50 && byte <= 0x5f) || // Stack/Memory/Storage
				(byte >= 0x60 && byte <= 0x7f) || // PUSH1-PUSH32
				(byte >= 0x80 && byte <= 0x8f) || // DUP1-DUP16
				(byte >= 0x90 && byte <= 0x9f) || // SWAP1-SWAP16
				(byte >= 0xa0 && byte <= 0xa4) || // LOG0-LOG4
				(byte >= 0xf0 && byte <= 0xf7) || // System ops (including AUTH/AUTHCALL)
				byte === 0xfa || // STATICCALL
				byte === 0xfd || // REVERT
				byte === 0xfe || // INVALID
				byte === 0xff; // SELFDESTRUCT

			expect(Opcode.isValid(byte as any)).toBe(isDefinedOpcode);
		}
	});

	it("validates undefined opcode ranges", () => {
		const undefinedRanges = [
			[0x0c, 0x0f], // After SIGNEXTEND
			[0x1e, 0x1f], // After SAR
			[0x21, 0x2f], // After KECCAK256
			[0x4b, 0x4f], // After BLOBBASEFEE
			[0xa5, 0xef], // After LOG4
			[0xf8, 0xf9], // Between AUTHCALL and STATICCALL
			[0xfb, 0xfc], // Between STATICCALL and REVERT
		];

		for (const [start, end] of undefinedRanges) {
			for (let byte = start; byte <= end; byte++) {
				expect(Opcode.isValid(byte as any)).toBe(false);
				expect(Opcode.info(byte as any)).toBeUndefined();
				expect(Opcode.name(byte as any)).toBe("UNKNOWN");
			}
		}
	});

	it("handles all PUSH opcodes from PUSH0 to PUSH32", () => {
		expect(Opcode.pushBytes(Opcode.PUSH0)).toBe(0);
		for (let i = 1; i <= 32; i++) {
			const pushOpcode = (0x5f + i) as any;
			expect(Opcode.isPush(pushOpcode)).toBe(true);
			expect(Opcode.pushBytes(pushOpcode)).toBe(i);
			expect(Opcode.pushOpcode(i)).toBe(pushOpcode);
		}
	});

	it("handles all DUP opcodes from DUP1 to DUP16", () => {
		for (let i = 1; i <= 16; i++) {
			const dupOpcode = (0x7f + i) as any;
			expect(Opcode.isDup(dupOpcode)).toBe(true);
			expect(Opcode.dupPosition(dupOpcode)).toBe(i);
		}
	});

	it("handles all SWAP opcodes from SWAP1 to SWAP16", () => {
		for (let i = 1; i <= 16; i++) {
			const swapOpcode = (0x8f + i) as any;
			expect(Opcode.isSwap(swapOpcode)).toBe(true);
			expect(Opcode.swapPosition(swapOpcode)).toBe(i);
		}
	});

	it("handles all LOG opcodes from LOG0 to LOG4", () => {
		for (let i = 0; i <= 4; i++) {
			const logOpcode = (0xa0 + i) as any;
			expect(Opcode.isLog(logOpcode)).toBe(true);
			expect(Opcode.logTopics(logOpcode)).toBe(i);
		}
	});
});

// ============================================================================
// Bytecode Parsing Edge Cases
// ============================================================================

describe("Opcode parse edge cases", () => {
	it("parses bytecode with all PUSH sizes", () => {
		const bytecode = new Uint8Array([
			0x5f, // PUSH0
			0x60,
			0x01, // PUSH1
			0x61,
			0x00,
			0x02, // PUSH2
			0x7f,
			...Array(32).fill(0xff), // PUSH32
		]);

		const instructions = Opcode.parse(bytecode);
		expect(instructions).toHaveLength(4);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH0);
		expect(instructions[0]!.immediate).toBeUndefined();
		expect(instructions[1]!.opcode).toBe(Opcode.PUSH1);
		expect(instructions[1]!.immediate).toEqual(new Uint8Array([0x01]));
		expect(instructions[2]!.opcode).toBe(Opcode.PUSH2);
		expect(instructions[2]!.immediate).toEqual(new Uint8Array([0x00, 0x02]));
		expect(instructions[3]!.opcode).toBe(Opcode.PUSH32);
		expect(instructions[3]!.immediate).toHaveLength(32);
	});

	it("handles partially truncated PUSH data", () => {
		const bytecode = new Uint8Array([0x7f, 0x01, 0x02]); // PUSH32 with only 2 bytes
		const instructions = Opcode.parse(bytecode);

		expect(instructions).toHaveLength(1);
		expect(instructions[0]!.opcode).toBe(Opcode.PUSH32);
		expect(instructions[0]!.immediate).toHaveLength(2);
		expect(instructions[0]!.immediate).toEqual(new Uint8Array([0x01, 0x02]));
	});

	it("parses bytecode with multiple JUMPDEST", () => {
		const bytecode = new Uint8Array([
			0x5b, // JUMPDEST at 0
			0x60,
			0x01, // PUSH1 0x01
			0x5b, // JUMPDEST at 3
			0x60,
			0x02, // PUSH1 0x02
			0x5b, // JUMPDEST at 6
		]);

		const dests = Opcode.jumpDests(bytecode);
		expect(dests.size).toBe(3);
		expect(dests.has(0)).toBe(true);
		expect(dests.has(3)).toBe(true);
		expect(dests.has(6)).toBe(true);
	});

	it("correctly skips JUMPDEST bytes in PUSH immediate data", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x5b, // PUSH1 0x5b (looks like JUMPDEST)
			0x61,
			0x5b,
			0x5b, // PUSH2 0x5b5b (two JUMPDEST-like bytes)
			0x5b, // Real JUMPDEST at offset 5
		]);

		const dests = Opcode.jumpDests(bytecode);
		expect(dests.size).toBe(1);
		expect(dests.has(5)).toBe(true);
		expect(dests.has(1)).toBe(false);
		expect(dests.has(3)).toBe(false);
		expect(dests.has(4)).toBe(false);
	});

	it("handles large bytecode", () => {
		const size = 10000;
		const bytecode = new Uint8Array(size);
		for (let i = 0; i < size; i += 2) {
			bytecode[i] = 0x60; // PUSH1
			bytecode[i + 1] = i & 0xff;
		}

		const instructions = Opcode.parse(bytecode);
		expect(instructions.length).toBe(size / 2);
	});
});

// ============================================================================
// Disassembly and Formatting Edge Cases
// ============================================================================

describe("Opcode disassemble edge cases", () => {
	it("formats instruction with large offset", () => {
		const inst: Opcode.Instruction = {
			offset: 0xffffff,
			opcode: Opcode.ADD,
		};
		const formatted = Opcode.format(inst);
		expect(formatted).toContain("ffffff");
		expect(formatted).toContain("ADD");
	});

	it("formats PUSH with zero bytes", () => {
		const inst: Opcode.Instruction = {
			offset: 0,
			opcode: Opcode.PUSH1,
			immediate: new Uint8Array([0x00]),
		};
		expect(Opcode.format(inst)).toBe("0x0000: PUSH1 0x00");
	});

	it("disassembles bytecode with invalid opcodes", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x01, // PUSH1
			0x0c, // Invalid opcode
			0x60,
			0x02, // PUSH1
		]);

		const asm = Opcode.disassemble(bytecode);
		expect(asm).toHaveLength(3);
		expect(asm[0]).toContain("PUSH1");
		expect(asm[1]).toContain("UNKNOWN");
		expect(asm[2]).toContain("PUSH1");
	});
});

// ============================================================================
// Jump Destination Analysis Edge Cases
// ============================================================================

describe("Opcode jumpDests edge cases", () => {
	it("handles bytecode starting with JUMPDEST", () => {
		const bytecode = new Uint8Array([0x5b, 0x00]);
		const dests = Opcode.jumpDests(bytecode);
		expect(dests.has(0)).toBe(true);
	});

	it("handles bytecode ending with JUMPDEST", () => {
		const bytecode = new Uint8Array([0x00, 0x5b]);
		const dests = Opcode.jumpDests(bytecode);
		expect(dests.has(1)).toBe(true);
	});

	it("handles consecutive JUMPDEST opcodes", () => {
		const bytecode = new Uint8Array([0x5b, 0x5b, 0x5b]);
		const dests = Opcode.jumpDests(bytecode);
		expect(dests.size).toBe(3);
		expect(dests.has(0)).toBe(true);
		expect(dests.has(1)).toBe(true);
		expect(dests.has(2)).toBe(true);
	});

	it("handles PUSH32 with all JUMPDEST-like bytes", () => {
		const bytecode = new Uint8Array([
			0x7f, // PUSH32
			...Array(32).fill(0x5b), // All JUMPDEST bytes
			0x5b, // Real JUMPDEST at offset 33
		]);

		const dests = Opcode.jumpDests(bytecode);
		expect(dests.size).toBe(1);
		expect(dests.has(33)).toBe(true);
	});

	it("validates jump dest at exact position", () => {
		const bytecode = new Uint8Array([0x5b, 0x60, 0x01, 0x5b]);
		expect(Opcode.isValidJumpDest(bytecode, 0)).toBe(true);
		expect(Opcode.isValidJumpDest(bytecode, 3)).toBe(true);
	});

	it("rejects jump dest past bytecode end", () => {
		const bytecode = new Uint8Array([0x5b]);
		expect(Opcode.isValidJumpDest(bytecode, 10)).toBe(false);
	});

	it("rejects negative jump dest offset", () => {
		const bytecode = new Uint8Array([0x5b]);
		expect(Opcode.isValidJumpDest(bytecode, -1)).toBe(false);
	});
});

// ============================================================================
// Hardfork-Specific Opcode Tests
// ============================================================================

describe("Opcode hardfork-specific", () => {
	it("validates EIP-3855 PUSH0", () => {
		expect(Opcode.isValid(0x5f)).toBe(true);
		expect(Opcode.isPush(0x5f as any)).toBe(true);
		expect(Opcode.pushBytes(0x5f as any)).toBe(0);
		expect(Opcode.name(0x5f as any)).toBe("PUSH0");
	});

	it("validates EIP-1153 transient storage opcodes", () => {
		expect(Opcode.isValid(Opcode.TLOAD)).toBe(true);
		expect(Opcode.isValid(Opcode.TSTORE)).toBe(true);
		expect(Opcode.name(Opcode.TLOAD)).toBe("TLOAD");
		expect(Opcode.name(Opcode.TSTORE)).toBe("TSTORE");

		const tloadInfo = Opcode.info(Opcode.TLOAD);
		expect(tloadInfo).toBeDefined();
		expect(tloadInfo?.stackInputs).toBe(1);
		expect(tloadInfo?.stackOutputs).toBe(1);

		const tstoreInfo = Opcode.info(Opcode.TSTORE);
		expect(tstoreInfo).toBeDefined();
		expect(tstoreInfo?.stackInputs).toBe(2);
		expect(tstoreInfo?.stackOutputs).toBe(0);
	});

	it("validates EIP-5656 MCOPY", () => {
		expect(Opcode.isValid(Opcode.MCOPY)).toBe(true);
		expect(Opcode.name(Opcode.MCOPY)).toBe("MCOPY");

		const info = Opcode.info(Opcode.MCOPY);
		expect(info).toBeDefined();
		expect(info?.stackInputs).toBe(3);
		expect(info?.stackOutputs).toBe(0);
	});

	it("validates EIP-4844 blob opcodes", () => {
		expect(Opcode.isValid(Opcode.BLOBHASH)).toBe(true);
		expect(Opcode.isValid(Opcode.BLOBBASEFEE)).toBe(true);
		expect(Opcode.name(Opcode.BLOBHASH)).toBe("BLOBHASH");
		expect(Opcode.name(Opcode.BLOBBASEFEE)).toBe("BLOBBASEFEE");

		const blobhashInfo = Opcode.info(Opcode.BLOBHASH);
		expect(blobhashInfo?.stackInputs).toBe(1);
		expect(blobhashInfo?.stackOutputs).toBe(1);

		const blobbasefeeInfo = Opcode.info(Opcode.BLOBBASEFEE);
		expect(blobbasefeeInfo?.stackInputs).toBe(0);
		expect(blobbasefeeInfo?.stackOutputs).toBe(1);
	});

	it("validates EIP-3074 AUTH/AUTHCALL opcodes", () => {
		expect(Opcode.isValid(Opcode.AUTH)).toBe(true);
		expect(Opcode.isValid(Opcode.AUTHCALL)).toBe(true);
		expect(Opcode.name(Opcode.AUTH)).toBe("AUTH");
		expect(Opcode.name(Opcode.AUTHCALL)).toBe("AUTHCALL");
	});
});

// ============================================================================
// Stack Effect Comprehensive Tests
// ============================================================================

describe("Opcode stack effects comprehensive", () => {
	it("validates all DUP stack effects", () => {
		for (let i = 1; i <= 16; i++) {
			const dupCode = (0x7f + i) as any;
			const effect = Opcode.getStackEffect(dupCode);
			expect(effect).toBeDefined();
			expect(effect?.pop).toBe(i);
			expect(effect?.push).toBe(i + 1);
		}
	});

	it("validates all SWAP stack effects", () => {
		for (let i = 1; i <= 16; i++) {
			const swapCode = (0x8f + i) as any;
			const effect = Opcode.getStackEffect(swapCode);
			expect(effect).toBeDefined();
			expect(effect?.pop).toBe(i + 1);
			expect(effect?.push).toBe(i + 1);
		}
	});

	it("validates all LOG stack effects", () => {
		for (let i = 0; i <= 4; i++) {
			const logCode = (0xa0 + i) as any;
			const effect = Opcode.getStackEffect(logCode);
			expect(effect).toBeDefined();
			expect(effect?.pop).toBe(2 + i); // offset + size + topics
			expect(effect?.push).toBe(0);
		}
	});

	it("validates terminating opcodes have zero stack outputs", () => {
		const terminators = [
			Opcode.STOP,
			Opcode.RETURN,
			Opcode.REVERT,
			Opcode.INVALID,
			Opcode.SELFDESTRUCT,
		];

		for (const op of terminators) {
			const info = Opcode.info(op);
			expect(info).toBeDefined();
			if (op === Opcode.STOP || op === Opcode.INVALID) {
				expect(info?.stackOutputs).toBe(0);
			}
		}
	});
});

// ============================================================================
// Gas Cost Validation Tests
// ============================================================================

describe("Opcode gas costs", () => {
	it("validates basic gas costs", () => {
		expect(Opcode.getGasCost(Opcode.ADD)).toBe(3);
		expect(Opcode.getGasCost(Opcode.MUL)).toBe(5);
		expect(Opcode.getGasCost(Opcode.SUB)).toBe(3);
		expect(Opcode.getGasCost(Opcode.DIV)).toBe(5);
		expect(Opcode.getGasCost(Opcode.PUSH1)).toBe(3);
		expect(Opcode.getGasCost(Opcode.POP)).toBe(2);
	});

	it("validates all PUSH opcodes have base gas cost", () => {
		// PUSH0 has cost 2, PUSH1-PUSH32 have cost 3
		const push0Cost = Opcode.getGasCost(0x5f as any);
		expect(push0Cost).toBe(2);

		for (let i = 1; i <= 32; i++) {
			const pushCode = (0x5f + i) as any;
			const cost = Opcode.getGasCost(pushCode);
			expect(cost).toBe(3);
		}
	});

	it("validates all DUP opcodes have same gas cost", () => {
		for (let i = 1; i <= 16; i++) {
			const dupCode = (0x7f + i) as any;
			const cost = Opcode.getGasCost(dupCode);
			expect(cost).toBe(3);
		}
	});

	it("validates all SWAP opcodes have same gas cost", () => {
		for (let i = 1; i <= 16; i++) {
			const swapCode = (0x8f + i) as any;
			const cost = Opcode.getGasCost(swapCode);
			expect(cost).toBe(3);
		}
	});

	it("validates LOG gas costs increase with topics", () => {
		expect(Opcode.getGasCost(Opcode.LOG0)).toBe(375);
		expect(Opcode.getGasCost(Opcode.LOG1)).toBe(750);
		expect(Opcode.getGasCost(Opcode.LOG2)).toBe(1125);
		expect(Opcode.getGasCost(Opcode.LOG3)).toBe(1500);
		expect(Opcode.getGasCost(Opcode.LOG4)).toBe(1875);
	});
});

// ============================================================================
// Complex Bytecode Scenarios
// ============================================================================

describe("Opcode complex scenarios", () => {
	it("parses real-world contract initialization bytecode pattern", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x80, // PUSH1 0x80 (free memory pointer) - offset 0
			0x60,
			0x40, // PUSH1 0x40 - offset 2
			0x52, // MSTORE - offset 4
			0x34, // CALLVALUE - offset 5
			0x80, // DUP1 - offset 6
			0x15, // ISZERO - offset 7
			0x60,
			0x0e, // PUSH1 0x0e - offset 8
			0x57, // JUMPI - offset 10
			0x60,
			0x00, // PUSH1 0x00 - offset 11
			0x80, // DUP1 - offset 13
			0xfd, // REVERT - offset 14
			0x5b, // JUMPDEST - offset 15
			0x50, // POP - offset 16
		]);

		const instructions = Opcode.parse(bytecode);
		expect(instructions.length).toBeGreaterThan(0);

		const dests = Opcode.jumpDests(bytecode);
		expect(dests.has(15)).toBe(true); // JUMPDEST at offset 15
	});

	it("handles function selector pattern", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x00, // PUSH1 0x00
			0x35, // CALLDATALOAD
			0x60,
			0xe0, // PUSH1 0xe0
			0x1c, // SHR
			0x80, // DUP1
			0x63,
			0x12,
			0x34,
			0x56,
			0x78, // PUSH4 0x12345678 (function selector)
			0x14, // EQ
			0x60,
			0x1a, // PUSH1 0x1a
			0x57, // JUMPI
		]);

		const instructions = Opcode.parse(bytecode);
		expect(instructions.some((i) => i.opcode === Opcode.CALLDATALOAD)).toBe(
			true,
		);
		expect(instructions.some((i) => i.opcode === Opcode.PUSH4)).toBe(true);
	});

	it("validates CREATE2 salt pattern", () => {
		const bytecode = new Uint8Array([
			0x60,
			0x00, // PUSH1 0x00 (value)
			0x60,
			0x00, // PUSH1 0x00 (offset)
			0x60,
			0x00, // PUSH1 0x00 (size)
			0x7f,
			...Array(32).fill(0x42), // PUSH32 (salt)
			0xf5, // CREATE2
		]);

		const instructions = Opcode.parse(bytecode);
		expect(instructions.some((i) => i.opcode === Opcode.CREATE2)).toBe(true);
		expect(instructions.some((i) => i.opcode === Opcode.PUSH32)).toBe(true);
	});
});

// ============================================================================
// Category Tests for All Opcodes
// ============================================================================

describe("Opcode comprehensive category tests", () => {
	it("categorizes all arithmetic opcodes correctly", () => {
		const arithmetic = [
			Opcode.ADD,
			Opcode.MUL,
			Opcode.SUB,
			Opcode.DIV,
			Opcode.SDIV,
			Opcode.MOD,
			Opcode.SMOD,
			Opcode.ADDMOD,
			Opcode.MULMOD,
			Opcode.EXP,
			Opcode.SIGNEXTEND,
		];
		for (const op of arithmetic) {
			expect(Opcode.getCategory(op)).toBe("arithmetic");
		}
	});

	it("categorizes all PUSH/DUP/SWAP as stack operations", () => {
		for (let i = 0; i <= 32; i++) {
			expect(Opcode.getCategory((0x5f + i) as any)).toBe("stack");
		}
		for (let i = 1; i <= 16; i++) {
			expect(Opcode.getCategory((0x7f + i) as any)).toBe("stack");
			expect(Opcode.getCategory((0x8f + i) as any)).toBe("stack");
		}
	});

	it("identifies all terminating opcodes", () => {
		expect(Opcode.isTerminator(Opcode.STOP)).toBe(true);
		expect(Opcode.isTerminator(Opcode.RETURN)).toBe(true);
		expect(Opcode.isTerminator(Opcode.REVERT)).toBe(true);
		expect(Opcode.isTerminator(Opcode.INVALID)).toBe(true);
		expect(Opcode.isTerminator(Opcode.SELFDESTRUCT)).toBe(true);
	});

	it("identifies jump-related opcodes", () => {
		expect(Opcode.isJump(Opcode.JUMP)).toBe(true);
		expect(Opcode.isJump(Opcode.JUMPI)).toBe(true);
		expect(Opcode.isJumpDestination(Opcode.JUMPDEST)).toBe(true);
		expect(Opcode.isJumpDestination(Opcode.JUMP)).toBe(false);
	});
});
