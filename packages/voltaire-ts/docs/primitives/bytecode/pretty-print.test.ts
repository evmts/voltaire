import { describe, expect, it } from "vitest";

describe("Bytecode.prettyPrint (docs/primitives/bytecode/pretty-print.mdx)", () => {
	describe("Basic Pretty Printing", () => {
		it("should pretty print bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const pretty = code.prettyPrint();

			expect(typeof pretty).toBe("string");
			expect(pretty.length).toBeGreaterThan(0);
		});

		it("should handle empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");
			const pretty = code.prettyPrint();

			expect(typeof pretty).toBe("string");
		});
	});

	describe("Formatting Options", () => {
		it("should support showGas option", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const pretty = code.prettyPrint({ showGas: true });

			expect(typeof pretty).toBe("string");
		});

		it("should support showStack option", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const pretty = code.prettyPrint({ showStack: true });

			expect(typeof pretty).toBe("string");
		});

		it("should support lineNumbers option", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");
			const pretty = code.prettyPrint({ lineNumbers: true });

			expect(typeof pretty).toBe("string");
		});

		it("should support showBlocks option", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x60015b6002005600");
			const pretty = code.prettyPrint({ showBlocks: true });

			expect(typeof pretty).toBe("string");
		});

		it("should support multiple options", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6001600201");
			const pretty = code.prettyPrint({
				showGas: true,
				showStack: true,
				lineNumbers: true,
			});

			expect(typeof pretty).toBe("string");
		});
	});

	describe("Complex Bytecode", () => {
		it("should pretty print bytecode with jumps", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH1 0x05, JUMP, STOP, JUMPDEST, STOP
			const code = Bytecode("0x6005560000" + "5b00");
			const pretty = code.prettyPrint();

			expect(typeof pretty).toBe("string");
		});
	});
});
