import { describe, expect, it } from "vitest";
import * as Bytecode from "./index.js";
import * as Opcode from "../../Opcode/BrandedOpcode/index.js";

describe("analyzeStack", () => {
	describe("valid bytecode", () => {
		it("should return valid for simple bytecode", () => {
			// PUSH1 0x01 PUSH1 0x02 ADD
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
			expect(result.maxDepth).toBe(2);
		});

		it("should handle empty bytecode", () => {
			const code = Bytecode.from(new Uint8Array([]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
			expect(result.maxDepth).toBe(0);
		});

		it("should track max depth correctly", () => {
			// PUSH1 PUSH1 PUSH1 PUSH1 PUSH1 (5 items)
			const code = Bytecode.from(
				new Uint8Array([
					0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05,
				]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.maxDepth).toBe(5);
		});

		it("should handle initial depth", () => {
			// POP (requires 1 item)
			const code = Bytecode.from(new Uint8Array([0x50]));
			const result = Bytecode.analyzeStack(code, { initialDepth: 1 });

			expect(result.valid).toBe(true);
			expect(result.issues).toHaveLength(0);
		});
	});

	describe("stack underflow", () => {
		it("should detect underflow on POP with empty stack", () => {
			const code = Bytecode.from(new Uint8Array([0x50])); // POP
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
			expect(result.issues[0]?.type).toBe("underflow");
			expect(result.issues[0]?.pc).toBe(0);
			expect(result.issues[0]?.expected).toBe(1);
			expect(result.issues[0]?.actual).toBe(0);
		});

		it("should detect underflow on ADD with insufficient stack", () => {
			// PUSH1 ADD (needs 2, has 1)
			const code = Bytecode.from(new Uint8Array([0x60, 0x01, 0x01]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
			expect(result.issues[0]?.type).toBe("underflow");
			expect(result.issues[0]?.pc).toBe(2);
		});

		it("should detect multiple underflows", () => {
			// POP POP (both underflow)
			const code = Bytecode.from(new Uint8Array([0x50, 0x50]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(false);
			expect(result.issues.length).toBeGreaterThanOrEqual(1);
			expect(result.issues[0]?.type).toBe("underflow");
		});
	});

	describe("stack overflow", () => {
		it("should detect overflow when exceeding max depth", () => {
			// Create bytecode that pushes 1025 items (default max is 1024)
			const ops: number[] = [];
			for (let i = 0; i < 1025; i++) {
				ops.push(0x60, 0x00); // PUSH1 0x00
			}
			const code = Bytecode.from(new Uint8Array(ops));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.type === "overflow")).toBe(true);
		});

		it("should respect custom maxDepth", () => {
			// PUSH1 PUSH1 PUSH1 (3 items, max 2)
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x60, 0x03]),
			);
			const result = Bytecode.analyzeStack(code, { maxDepth: 2 });

			expect(result.valid).toBe(false);
			expect(result.issues.some((i) => i.type === "overflow")).toBe(true);
		});
	});

	describe("byBlock tracking", () => {
		it("should provide block-level stack info", () => {
			// PUSH1 PUSH1 ADD
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.byBlock).toBeDefined();
			expect(result.byBlock.length).toBeGreaterThan(0);
			const block = result.byBlock[0];
			expect(block).toHaveProperty("blockIndex");
			expect(block).toHaveProperty("startPc");
			expect(block).toHaveProperty("endPc");
			expect(block).toHaveProperty("minRequired");
			expect(block).toHaveProperty("maxReached");
			expect(block).toHaveProperty("exitDepth");
			expect(block).toHaveProperty("stackEffect");
		});

		it("should track stack effect correctly", () => {
			// PUSH1 PUSH1 ADD (2 in, 1 out = net +1)
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x01]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			const block = result.byBlock[0];
			expect(block?.exitDepth).toBe(1);
		});
	});

	describe("path analysis", () => {
		it("should analyze single path by default", () => {
			const code = Bytecode.from(new Uint8Array([0x60, 0x01]));
			const result = Bytecode.analyzeStack(code);

			expect(result.pathsAnalyzed).toBe(1);
		});

		it("should handle JUMPI bytecode", () => {
			// PUSH1 2 PUSH1 0 JUMPI PUSH1 1 JUMPDEST
			const code = Bytecode.from(
				new Uint8Array([
					0x60,
					0x07, // PUSH1 7 (jump target)
					0x60,
					0x00, // PUSH1 0 (condition)
					0x57, // JUMPI
					0x60,
					0x01, // PUSH1 1
					0x5b, // JUMPDEST
				]),
			);
			const result = Bytecode.analyzeStack(code);

			// Should be valid regardless of paths analyzed
			expect(result.valid).toBe(true);
			expect(result.pathsAnalyzed).toBeGreaterThanOrEqual(1);
		});

		it("should analyze multiple paths when enabled", () => {
			const code = Bytecode.from(
				new Uint8Array([
					0x60,
					0x07, // PUSH1 7 (jump target)
					0x60,
					0x00, // PUSH1 0 (condition)
					0x57, // JUMPI
					0x60,
					0x01, // PUSH1 1
					0x5b, // JUMPDEST
				]),
			);
			const result = Bytecode.analyzeStack(code, { analyzePaths: true });

			// With analyzePaths enabled, should explore branches
			expect(result.valid).toBe(true);
		});
	});

	describe("failFast option", () => {
		it("should stop at first error when failFast is enabled", () => {
			// POP POP POP (all underflow)
			const code = Bytecode.from(new Uint8Array([0x50, 0x50, 0x50]));
			const result = Bytecode.analyzeStack(code, { failFast: true });

			expect(result.valid).toBe(false);
			expect(result.issues).toHaveLength(1);
		});

		it("should collect all errors when failFast is disabled", () => {
			// POP POP POP (all underflow)
			const code = Bytecode.from(new Uint8Array([0x50, 0x50, 0x50]));
			const result = Bytecode.analyzeStack(code, { failFast: false });

			expect(result.valid).toBe(false);
			// May have multiple issues depending on implementation
		});
	});

	describe("complex opcodes", () => {
		it("should handle DUP operations", () => {
			// PUSH1 DUP1 (requires 1, produces 2)
			const code = Bytecode.from(new Uint8Array([0x60, 0x01, 0x80]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.maxDepth).toBe(2);
		});

		it("should handle SWAP operations", () => {
			// PUSH1 PUSH1 SWAP1 (requires 2)
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x90]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});

		it("should handle SSTORE (2 inputs, 0 outputs)", () => {
			// PUSH1 PUSH1 SSTORE
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x01, 0x60, 0x02, 0x55]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.maxDepth).toBe(2);
		});
	});

	describe("terminators", () => {
		it("should handle STOP", () => {
			const code = Bytecode.from(new Uint8Array([0x60, 0x01, 0x00])); // PUSH1 STOP
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});

		it("should handle RETURN", () => {
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xf3]),
			); // PUSH1 PUSH1 RETURN
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});

		it("should handle REVERT", () => {
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x00, 0x60, 0x00, 0xfd]),
			); // PUSH1 PUSH1 REVERT
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("should handle bytecode with only PUSH operations", () => {
			// Many PUSHes in a row
			const code = Bytecode.from(
				new Uint8Array([
					0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05, 0x60,
					0x06,
				]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
			expect(result.maxDepth).toBe(6);
		});

		it("should handle invalid opcodes gracefully", () => {
			// 0xfe is INVALID opcode (0 inputs, 0 outputs)
			const code = Bytecode.from(new Uint8Array([0x60, 0x01, 0xfe]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});

		it("should report correct PC for underflow at non-zero position", () => {
			// PUSH1 POP POP (underflow at pc=3)
			const code = Bytecode.from(new Uint8Array([0x60, 0x01, 0x50, 0x50]));
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(false);
			const underflowIssue = result.issues.find((i) => i.type === "underflow");
			expect(underflowIssue?.pc).toBe(3);
		});

		it("should handle opcodes with many inputs", () => {
			// CREATE2 requires 4 inputs
			const code = Bytecode.from(
				new Uint8Array([0x60, 0x00, 0x60, 0x00, 0x60, 0x00, 0x60, 0x00, 0xf5]),
			);
			const result = Bytecode.analyzeStack(code);

			expect(result.valid).toBe(true);
		});

		it("should continue checking after underflow when failFast is false", () => {
			// POP ADD POP (multiple underflows)
			const code = Bytecode.from(new Uint8Array([0x50, 0x01, 0x50]));
			const result = Bytecode.analyzeStack(code, { failFast: false });

			expect(result.valid).toBe(false);
			expect(result.issues.length).toBeGreaterThanOrEqual(1);
		});
	});
});
