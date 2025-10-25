import { describe, expect, test } from "bun:test";
import {
	analyzeJumpDestinations,
	validateBytecode,
	isBytecodeBoundary,
	isValidJumpDest,
} from "./bytecode";

describe("bytecode", () => {
	describe("analyzeJumpDestinations", () => {
		test("should find JUMPDEST at position 0", () => {
			// 0x5b is JUMPDEST opcode
			const bytecode = new Uint8Array([0x5b]);
			const result = analyzeJumpDestinations(bytecode);
			expect(result).toEqual([{ position: 0, valid: true }]);
		});

		test("should find multiple JUMPDESTs", () => {
			// 0x60 0x00 PUSH1 0x00, 0x5b JUMPDEST, 0x60 0x01 PUSH1 0x01, 0x5b JUMPDEST
			const bytecode = new Uint8Array([0x60, 0x00, 0x5b, 0x60, 0x01, 0x5b]);
			const result = analyzeJumpDestinations(bytecode);
			expect(result).toEqual([
				{ position: 2, valid: true },
				{ position: 5, valid: true },
			]);
		});

		test("should not mark JUMPDEST in PUSH data as valid", () => {
			// 0x60 0x5b PUSH1 0x5b (0x5b is data, not JUMPDEST)
			const bytecode = new Uint8Array([0x60, 0x5b]);
			const result = analyzeJumpDestinations(bytecode);
			expect(result).toEqual([]);
		});

		test("should handle hex string input", () => {
			const bytecode = "0x5b";
			const result = analyzeJumpDestinations(bytecode);
			expect(result).toEqual([{ position: 0, valid: true }]);
		});

		test("should handle empty bytecode", () => {
			const bytecode = new Uint8Array([]);
			const result = analyzeJumpDestinations(bytecode);
			expect(result).toEqual([]);
		});
	});

	describe("validateBytecode", () => {
		test("should validate correct bytecode", () => {
			const bytecode = new Uint8Array([0x60, 0x00, 0x5b]); // PUSH1 0, JUMPDEST
			expect(validateBytecode(bytecode)).toBe(true);
		});

		test("should invalidate truncated PUSH", () => {
			const bytecode = new Uint8Array([0x60]); // PUSH1 without data
			expect(validateBytecode(bytecode)).toBe(false);
		});

		test("should validate empty bytecode", () => {
			const bytecode = new Uint8Array([]);
			expect(validateBytecode(bytecode)).toBe(true);
		});

		test("should handle hex string input", () => {
			expect(validateBytecode("0x60005b")).toBe(true);
			expect(validateBytecode("0x60")).toBe(false);
		});
	});

	describe("isBytecodeBoundary", () => {
		test("should return true for position at opcode", () => {
			const bytecode = new Uint8Array([0x60, 0x00, 0x5b]); // PUSH1 0, JUMPDEST
			expect(isBytecodeBoundary(bytecode, 0)).toBe(true); // PUSH1
			expect(isBytecodeBoundary(bytecode, 2)).toBe(true); // JUMPDEST
		});

		test("should return false for position in PUSH data", () => {
			const bytecode = new Uint8Array([0x60, 0x00, 0x5b]);
			expect(isBytecodeBoundary(bytecode, 1)).toBe(false); // In PUSH1 data
		});

		test("should handle PUSH32", () => {
			// PUSH32 followed by 32 bytes of data
			const bytecode = new Uint8Array(34);
			bytecode[0] = 0x7f; // PUSH32
			for (let i = 1; i <= 32; i++) {
				bytecode[i] = 0xff;
			}
			bytecode[33] = 0x5b; // JUMPDEST

			expect(isBytecodeBoundary(bytecode, 0)).toBe(true); // PUSH32
			expect(isBytecodeBoundary(bytecode, 1)).toBe(false); // In data
			expect(isBytecodeBoundary(bytecode, 32)).toBe(false); // In data
			expect(isBytecodeBoundary(bytecode, 33)).toBe(true); // JUMPDEST
		});
	});

	describe("isValidJumpDest", () => {
		test("should return true for valid JUMPDEST", () => {
			const bytecode = new Uint8Array([0x60, 0x00, 0x5b]); // PUSH1 0, JUMPDEST
			expect(isValidJumpDest(bytecode, 2)).toBe(true);
		});

		test("should return false for JUMPDEST in PUSH data", () => {
			const bytecode = new Uint8Array([0x60, 0x5b]); // PUSH1 0x5b
			expect(isValidJumpDest(bytecode, 1)).toBe(false);
		});

		test("should return false for non-JUMPDEST opcode", () => {
			const bytecode = new Uint8Array([0x60, 0x00]); // PUSH1 0
			expect(isValidJumpDest(bytecode, 0)).toBe(false);
		});

		test("should return false for out of bounds position", () => {
			const bytecode = new Uint8Array([0x5b]);
			expect(isValidJumpDest(bytecode, 10)).toBe(false);
		});
	});
});
