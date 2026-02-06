import { describe, expect, it } from "vitest";

describe("Bytecode Index (docs/primitives/bytecode/index.mdx)", () => {
	it("should export Bytecode constructor from index", async () => {
		const { Bytecode } = await import(
			"../../../src/primitives/Bytecode/index.js"
		);
		expect(typeof Bytecode).toBe("function");
	});

	describe("Basic Usage Examples", () => {
		it("should create Bytecode from hex string", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// Example from index.mdx: Creating bytecode from hex
			const code = Bytecode("0x6001600201");

			expect(code).toBeInstanceOf(Uint8Array);
			expect(code.length).toBe(5);
		});

		it("should support namespace methods", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");

			// Verify namespace methods exist
			expect(typeof code.analyze).toBe("function");
			expect(typeof code.parseInstructions).toBe("function");
			expect(typeof code.validate).toBe("function");
			expect(typeof code.size).toBe("function");
			expect(typeof code.toHex).toBe("function");
		});

		it("should analyze bytecode structure", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x01, PUSH1 0x02, ADD
			const code = Bytecode("0x6001600201");
			const analysis = code.analyze();

			expect(analysis.valid).toBe(true);
			expect(analysis.instructions.length).toBe(3);
		});

		it("should parse individual instructions", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const instructions = code.parseInstructions();

			expect(instructions.length).toBe(3);
			expect(instructions[0].opcode).toBe(0x60); // PUSH1
			expect(instructions[0].pushData).toEqual(new Uint8Array([0x01]));
			expect(instructions[1].opcode).toBe(0x60); // PUSH1
			expect(instructions[1].pushData).toEqual(new Uint8Array([0x02]));
			expect(instructions[2].opcode).toBe(0x01); // ADD
		});
	});

	describe("Type Branding", () => {
		it("should be branded Uint8Array", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");

			// Should be Uint8Array instance
			expect(code).toBeInstanceOf(Uint8Array);

			// Should have branded methods attached
			expect(code.analyze).toBeDefined();
			expect(code.parseInstructions).toBeDefined();
		});
	});
});
