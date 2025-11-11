import { describe, it, expect } from "vitest";
import { from } from "./from.js";
import { detectFusions } from "./detectFusions.js";

describe("detectFusions", () => {
	describe("PUSH_JUMP (0x102)", () => {
		it("detects PUSH1 + JUMP pattern", () => {
			// PUSH1 0x10, JUMP
			const bytecode = from(new Uint8Array([0x60, 0x10, 0x56]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_jump",
				pc: 0,
				length: 3,
			});
		});

		it("detects PUSH2 + JUMP pattern", () => {
			// PUSH2 0x0100, JUMP
			const bytecode = from(new Uint8Array([0x61, 0x01, 0x00, 0x56]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_jump",
				pc: 0,
				length: 4,
			});
		});
	});

	describe("PUSH_JUMPI (0x103)", () => {
		it("detects PUSH1 + JUMPI pattern", () => {
			// PUSH1 0x20, JUMPI
			const bytecode = from(new Uint8Array([0x60, 0x20, 0x57]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_jumpi",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("PUSH_ADD (0x100)", () => {
		it("detects PUSH1 + ADD pattern", () => {
			// PUSH1 0x05, ADD
			const bytecode = from(new Uint8Array([0x60, 0x05, 0x01]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_add",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("PUSH_MUL (0x101)", () => {
		it("detects PUSH1 + MUL pattern", () => {
			// PUSH1 0x02, MUL
			const bytecode = from(new Uint8Array([0x60, 0x02, 0x02]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_mul",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("PUSH_SUB (0x104)", () => {
		it("detects PUSH1 + SUB pattern", () => {
			// PUSH1 0x01, SUB
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x03]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_sub",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("PUSH_DIV (0x105)", () => {
		it("detects PUSH1 + DIV pattern", () => {
			// PUSH1 0x02, DIV
			const bytecode = from(new Uint8Array([0x60, 0x02, 0x04]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_div",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("DUP_SWAP (0x106)", () => {
		it("detects DUP1 + SWAP1 pattern", () => {
			// DUP1, SWAP1
			const bytecode = from(new Uint8Array([0x80, 0x90]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "dup_swap",
				pc: 0,
				length: 2,
			});
		});

		it("detects DUP2 + SWAP2 pattern", () => {
			// DUP2, SWAP2
			const bytecode = from(new Uint8Array([0x81, 0x91]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "dup_swap",
				pc: 0,
				length: 2,
			});
		});
	});

	describe("SWAP_POP (0x107)", () => {
		it("detects SWAP1 + POP pattern", () => {
			// SWAP1, POP
			const bytecode = from(new Uint8Array([0x90, 0x50]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "swap_pop",
				pc: 0,
				length: 2,
			});
		});
	});

	describe("PUSH_DUP (0x108)", () => {
		it("detects PUSH1 + DUP1 pattern", () => {
			// PUSH1 0x01, DUP1
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x80]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_dup",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("PUSH_SWAP (0x109)", () => {
		it("detects PUSH1 + SWAP1 pattern", () => {
			// PUSH1 0x01, SWAP1
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x90]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_swap",
				pc: 0,
				length: 3,
			});
		});
	});

	describe("multiple fusions", () => {
		it("detects multiple fusions in bytecode", () => {
			// PUSH1 0x05, ADD, PUSH1 0x10, JUMP
			const bytecode = from(
				new Uint8Array([0x60, 0x05, 0x01, 0x60, 0x10, 0x56]),
			);
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(2);
			expect(fusions[0]).toEqual({
				type: "push_add",
				pc: 0,
				length: 3,
			});
			expect(fusions[1]).toEqual({
				type: "push_jump",
				pc: 3,
				length: 3,
			});
		});

		it("detects non-overlapping fusions", () => {
			// PUSH1 0x01, ADD, STOP, PUSH1 0x02, MUL
			const bytecode = from(
				new Uint8Array([0x60, 0x01, 0x01, 0x00, 0x60, 0x02, 0x02]),
			);
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(2);
			expect(fusions[0]).toEqual({
				type: "push_add",
				pc: 0,
				length: 3,
			});
			expect(fusions[1]).toEqual({
				type: "push_mul",
				pc: 4,
				length: 3,
			});
		});
	});

	describe("edge cases", () => {
		it("returns empty array for empty bytecode", () => {
			const bytecode = from(new Uint8Array([]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("returns empty array when no fusions present", () => {
			// PUSH1 0x01, STOP
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x00]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("handles truncated PUSH at end of bytecode", () => {
			// PUSH2 with only 1 byte of data
			const bytecode = from(new Uint8Array([0x61, 0x01]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("handles PUSH followed by EOF", () => {
			// PUSH1 0x01, <EOF>
			const bytecode = from(new Uint8Array([0x60, 0x01]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("does not detect fusion when PUSH data contains next opcode", () => {
			// PUSH2 0x0156 (0x56 is JUMP opcode in data, not instruction)
			const bytecode = from(new Uint8Array([0x61, 0x01, 0x56]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("detects fusion with PUSH32", () => {
			// PUSH32 0x00...01, ADD
			const data = new Uint8Array(34);
			data[0] = 0x7f; // PUSH32
			data[32] = 0x01; // value byte 31 (last byte)
			data[33] = 0x01; // ADD
			const bytecode = from(data);
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0]).toEqual({
				type: "push_add",
				pc: 0,
				length: 34,
			});
		});
	});

	describe("DUP/SWAP depth matching", () => {
		it("only detects DUP_SWAP when depths match", () => {
			// DUP1 + SWAP2 (depths don't match)
			const bytecode = from(new Uint8Array([0x80, 0x91]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(0);
		});

		it("detects DUP_SWAP for all matching depths (1-16)", () => {
			// DUP1 + SWAP1
			let bytecode = from(new Uint8Array([0x80, 0x90]));
			let fusions = detectFusions(bytecode);
			expect(fusions).toHaveLength(1);

			// DUP16 + SWAP16
			bytecode = from(new Uint8Array([0x8f, 0x9f]));
			fusions = detectFusions(bytecode);
			expect(fusions).toHaveLength(1);
		});
	});

	describe("SWAP_POP with any SWAP depth", () => {
		it("detects SWAP_POP for SWAP1 through SWAP16", () => {
			// SWAP1 + POP
			let bytecode = from(new Uint8Array([0x90, 0x50]));
			let fusions = detectFusions(bytecode);
			expect(fusions).toHaveLength(1);

			// SWAP16 + POP
			bytecode = from(new Uint8Array([0x9f, 0x50]));
			fusions = detectFusions(bytecode);
			expect(fusions).toHaveLength(1);
		});
	});

	describe("PUSH + DUP/SWAP with any depth", () => {
		it("detects PUSH_DUP with any DUP depth", () => {
			// PUSH1 + DUP16
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x8f]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0].type).toBe("push_dup");
		});

		it("detects PUSH_SWAP with any SWAP depth", () => {
			// PUSH1 + SWAP16
			const bytecode = from(new Uint8Array([0x60, 0x01, 0x9f]));
			const fusions = detectFusions(bytecode);

			expect(fusions).toHaveLength(1);
			expect(fusions[0].type).toBe("push_swap");
		});
	});
});
