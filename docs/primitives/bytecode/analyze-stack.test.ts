import { describe, expect, it } from "vitest";

describe("Bytecode.analyzeStack (docs/primitives/bytecode/analyze-stack.mdx)", () => {
	describe("Basic Stack Analysis", () => {
		it("should analyze stack usage", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01, PUSH1 0x02, ADD
			const code = Bytecode("0x6001600201");
			const stackAnalysis = code.analyzeStack();

			expect(typeof stackAnalysis.valid).toBe("boolean");
			expect(typeof stackAnalysis.maxDepth).toBe("number");
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.valid).toBe(true);
			expect(stackAnalysis.maxDepth).toBe(0);
		});
	});

	describe("Stack Underflow Detection", () => {
		it("should detect stack underflow", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// ADD without items on stack
			const code = Bytecode("0x01");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.valid).toBe(false);
			expect(stackAnalysis.issues.some((i) => i.type === "underflow")).toBe(
				true,
			);
		});
	});

	describe("Stack Overflow Detection", () => {
		it("should detect stack overflow (>1024)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Many PUSH operations to exceed stack limit
			const pushes = new Array(1030).fill([0x60, 0x00]).flat();
			const code = Bytecode(new Uint8Array(pushes));
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.maxDepth).toBeGreaterThan(1024);
			expect(stackAnalysis.valid).toBe(false);
		});
	});

	describe("Stack Depth Tracking", () => {
		it("should track max stack depth", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1, PUSH1, PUSH1 (depth=3)
			const code = Bytecode("0x600160026003");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.maxDepth).toBe(3);
		});

		it("should track PUSH/POP patterns", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1, POP
			const code = Bytecode("0x600150");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.valid).toBe(true);
		});
	});

	describe("DUP and SWAP", () => {
		it("should handle DUP operations", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1, DUP1
			const code = Bytecode("0x600180");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.valid).toBe(true);
			expect(stackAnalysis.maxDepth).toBeGreaterThanOrEqual(2);
		});

		it("should handle SWAP operations", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1, PUSH1, SWAP1
			const code = Bytecode("0x60016002" + "90");
			const stackAnalysis = code.analyzeStack();

			expect(stackAnalysis.valid).toBe(true);
		});
	});

	describe("Return Type", () => {
		it("should return StackAnalysis structure", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const stackAnalysis = code.analyzeStack();

			expect(typeof stackAnalysis.valid).toBe("boolean");
			expect(typeof stackAnalysis.maxDepth).toBe("number");
			expect(Array.isArray(stackAnalysis.issues)).toBe(true);
			expect(Array.isArray(stackAnalysis.byBlock)).toBe(true);
		});
	});
});
