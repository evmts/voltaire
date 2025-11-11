import { describe, expect, it, beforeAll } from "vitest";
import * as BytecodeWasm from "./Bytecode.wasm.js";
import * as BytecodeTS from "./BrandedBytecode/index.js";
import type { BrandedBytecode } from "./BrandedBytecode/index.js";
import { loadWasm } from "../../wasm-loader/loader.js";

// Load WASM before running tests
beforeAll(async () => {
	await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));
});

// Helper to create branded bytecode
const bc = (arr: Uint8Array): BrandedBytecode => arr as BrandedBytecode;

describe("Bytecode.wasm WASM-accelerated methods", () => {
	// ========================================================================
	// WASM-accelerated analysis methods
	// ========================================================================

	describe("analyzeJumpDestinations (WASM accelerated)", () => {
		it("finds JUMPDEST opcodes", () => {
			// 0x5b is JUMPDEST
			const code = bc(new Uint8Array([0x5b, 0x60, 0x01, 0x5b]));
			const jumpdests = BytecodeWasm.analyzeJumpDestinations(code);

			// WASM returns array of numbers
			expect(Array.isArray(jumpdests)).toBe(true);
			expect(jumpdests).toContain(0);
			expect(jumpdests).toContain(3);
			expect(jumpdests.length).toBe(2);
		});

		it("returns empty array for bytecode without JUMPDEST", () => {
			// Only regular opcodes, no JUMPDEST
			const code = bc(new Uint8Array([0x60, 0x01, 0x01]));
			const jumpdests = BytecodeWasm.analyzeJumpDestinations(code);

			expect(jumpdests).toEqual([]);
		});

		it("skips JUMPDEST inside PUSH data", () => {
			// PUSH1 0x5b (0x60 = PUSH1, 0x5b is data, not opcode)
			const code = bc(new Uint8Array([0x60, 0x5b, 0x5b])); // PUSH1 0x5b, then JUMPDEST
			const jumpdests = BytecodeWasm.analyzeJumpDestinations(code);

			// Should only find the JUMPDEST at position 2, not the 0x5b in PUSH data
			expect(jumpdests).toContain(2);
			expect(jumpdests).not.toContain(1);
		});

		it("matches TypeScript implementation (as array)", () => {
			const code = bc(
				new Uint8Array([
					0x60, 0x01, // PUSH1 0x01
					0x5b, // JUMPDEST
					0x60, 0x02, // PUSH1 0x02
					0x5b, // JUMPDEST
					0x00, // STOP
				]),
			);

			const wasmResult = BytecodeWasm.analyzeJumpDestinations(code);
			const tsResult = BytecodeTS.analyzeJumpDestinations(code);

			// TypeScript returns Set, WASM returns array
			expect(wasmResult.sort()).toEqual(Array.from(tsResult).sort());
		});
	});

	describe("isBytecodeBoundary (WASM accelerated)", () => {
		it("returns true for opcode positions", () => {
			const code = bc(new Uint8Array([0x60, 0x01, 0x01])); // PUSH1 0x01, ADD
			expect(BytecodeWasm.isBytecodeBoundary(code, 0)).toBe(true); // PUSH1
			expect(BytecodeWasm.isBytecodeBoundary(code, 2)).toBe(true); // ADD
		});

		it("returns false for positions inside PUSH data", () => {
			const code = bc(new Uint8Array([0x60, 0x01, 0x01])); // PUSH1 0x01, ADD
			expect(BytecodeWasm.isBytecodeBoundary(code, 1)).toBe(false); // Inside PUSH1 data
		});

		it("returns false for out-of-bounds positions", () => {
			const code = bc(new Uint8Array([0x60, 0x01]));
			expect(BytecodeWasm.isBytecodeBoundary(code, 10)).toBe(false);
		});

		it("validates instruction boundaries correctly", () => {
			const code = bc(
				new Uint8Array([
					0x60, 0x01, // PUSH1 0x01
					0x60, 0x02, // PUSH1 0x02
				]),
			);

			expect(BytecodeWasm.isBytecodeBoundary(code, 0)).toBe(true); // PUSH1 opcode
			expect(BytecodeWasm.isBytecodeBoundary(code, 1)).toBe(false); // data for PUSH1
			expect(BytecodeWasm.isBytecodeBoundary(code, 2)).toBe(true); // PUSH1 opcode
			expect(BytecodeWasm.isBytecodeBoundary(code, 3)).toBe(false); // data for PUSH1
		});
	});

	describe("isValidJumpDest (WASM accelerated)", () => {
		it("identifies JUMPDEST at position 0", () => {
			const code = bc(new Uint8Array([0x5b])); // Just JUMPDEST
			expect(BytecodeWasm.isValidJumpDest(code, 0)).toBe(true);
		});

		it("identifies JUMPDEST in middle of code", () => {
			const code = bc(new Uint8Array([0x60, 0x01, 0x5b]));
			expect(BytecodeWasm.isValidJumpDest(code, 2)).toBe(true);
		});

		it("returns false for non-JUMPDEST opcodes", () => {
			const code = bc(new Uint8Array([0x60, 0x01, 0x01])); // PUSH1, data, ADD
			expect(BytecodeWasm.isValidJumpDest(code, 0)).toBe(false); // PUSH1
			expect(BytecodeWasm.isValidJumpDest(code, 2)).toBe(false); // ADD
		});

		it("returns false for positions inside PUSH data", () => {
			const code = bc(new Uint8Array([0x60, 0x5b])); // PUSH1 0x5b (0x5b is not opcode, just data)
			expect(BytecodeWasm.isValidJumpDest(code, 1)).toBe(false);
		});

		it("returns false for out-of-bounds positions", () => {
			const code = bc(new Uint8Array([0x5b]));
			expect(BytecodeWasm.isValidJumpDest(code, 5)).toBe(false);
		});

		it("matches TypeScript implementation", () => {
			const code = bc(
				new Uint8Array([
					0x5b, // JUMPDEST at 0
					0x60, 0x01, // PUSH1 0x01
					0x5b, // JUMPDEST at 3
					0x01, // ADD at 4
				]),
			);

			for (let i = 0; i < code.length; i++) {
				const wasmResult = BytecodeWasm.isValidJumpDest(code, i);
				const tsResult = BytecodeTS.isValidJumpDest(code, i);
				expect(wasmResult).toBe(
					tsResult,
					`JumpDest check mismatch at position ${i}`,
				);
			}
		});
	});

	describe("validate (WASM accelerated)", () => {
		it("accepts valid bytecode", () => {
			const code = bc(new Uint8Array([0x60, 0x01, 0x01])); // PUSH1 0x01, ADD
			expect(() => BytecodeWasm.validate(code)).not.toThrow();
		});

		it("accepts empty bytecode", () => {
			const code = bc(new Uint8Array([]));
			expect(() => BytecodeWasm.validate(code)).not.toThrow();
		});

		it("accepts single opcode", () => {
			const code = bc(new Uint8Array([0x5b])); // JUMPDEST
			expect(() => BytecodeWasm.validate(code)).not.toThrow();
		});

		it("throws for incomplete PUSH data", () => {
			// PUSH1 at end with no data byte
			const code = bc(new Uint8Array([0x60]));
			expect(() => BytecodeWasm.validate(code)).toThrow();
		});

		it("throws for PUSH with truncated data", () => {
			// PUSH3 but only 1 byte of data
			const code = bc(new Uint8Array([0x62, 0x01]));
			expect(() => BytecodeWasm.validate(code)).toThrow();
		});

		it("validates common bytecode patterns", () => {
			// Valid patterns that should not throw
			const validCases = [
				new Uint8Array([0x60, 0x01]), // PUSH1 0x01
				new Uint8Array([0x5b, 0x5b]), // JUMPDEST, JUMPDEST
				new Uint8Array([0x60, 0x01, 0x01, 0x5b]), // PUSH1 0x01, ADD, JUMPDEST
				new Uint8Array([]), // Empty
			];

			for (const testCase of validCases) {
				const code = bc(testCase);
				expect(() => BytecodeWasm.validate(code)).not.toThrow(
					`Valid bytecode rejected: ${testCase.toString()}`,
				);
			}
		});

		it("rejects incomplete bytecode", () => {
			// Invalid patterns that should throw
			const invalidCases = [
				new Uint8Array([0x60]), // Incomplete PUSH1
				new Uint8Array([0x62, 0x01]), // Incomplete PUSH3
			];

			for (const testCase of invalidCases) {
				const code = bc(testCase);
				expect(() => BytecodeWasm.validate(code)).toThrow();
			}
		});
	});

	// ========================================================================
	// Re-exported TypeScript methods verification
	// ========================================================================

	describe("Re-exported TypeScript methods", () => {
		it("exports all required methods", () => {
			const requiredMethods = [
				"analyze",
				"analyzeBlocks",
				"analyzeGas",
				"analyzeStack",
				"detectFusions",
				"equals",
				"extractRuntime",
				"formatInstruction",
				"formatInstructions",
				"from",
				"fromHex",
				"getBlock",
				"getPushSize",
				"hash",
				"hasMetadata",
				"isPush",
				"isTerminator",
				"parseInstructions",
				"prettyPrint",
				"scan",
				"size",
				"stripMetadata",
				"toAbi",
				"toHex",
				"_getNextPc",
				// WASM-accelerated
				"analyzeJumpDestinations",
				"isBytecodeBoundary",
				"isValidJumpDest",
				"validate",
			];

			for (const method of requiredMethods) {
				expect(BytecodeWasm).toHaveProperty(method);
				expect(typeof BytecodeWasm[method]).not.toBe("undefined");
			}
		});

		it("from and fromHex create Bytecode instances", () => {
			const code1 = BytecodeWasm.from("0x6001");
			const code2 = BytecodeWasm.fromHex("0x6001");

			expect(code1).toBeInstanceOf(Uint8Array);
			expect(code2).toBeInstanceOf(Uint8Array);
			expect(code1.length).toBe(2);
			expect(code2.length).toBe(2);
		});
	});

	// ========================================================================
	// Integration tests
	// ========================================================================

	describe("Integration with BrandedBytecode", () => {
		it("WASM and TypeScript methods produce consistent results", () => {
			const code = bc(
				new Uint8Array([
					0x60, 0x10, // PUSH1 0x10
					0x60, 0x00, // PUSH1 0x00
					0x5b, // JUMPDEST
					0x60, 0x01, // PUSH1 0x01
					0x01, // ADD
					0x5b, // JUMPDEST
					0x00, // STOP
				]),
			);

			// Both should find same jumpdests
			const wasmDests = BytecodeWasm.analyzeJumpDestinations(code);
			const tsDests = BytecodeTS.analyzeJumpDestinations(code);
			expect(wasmDests.sort()).toEqual(Array.from(tsDests).sort());

			// Both should validate the same
			expect(() => BytecodeWasm.validate(code)).not.toThrow();
			expect(() => BytecodeTS.validate(code)).not.toThrow();

			// Check boundaries and jump dests consistently
			for (let i = 0; i < code.length; i++) {
				const wasmBoundary = BytecodeWasm.isBytecodeBoundary(code, i);
				const wasmJump = BytecodeWasm.isValidJumpDest(code, i);

				const tsJump = BytecodeTS.isValidJumpDest(code, i);
				expect(wasmJump).toBe(tsJump);

				// If it's a JUMPDEST, it should be a boundary
				if (wasmJump) {
					expect(wasmBoundary).toBe(true);
				}
			}
		});
	});
});
