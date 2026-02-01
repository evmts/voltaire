import { describe, expect, it } from "vitest";

describe("Bytecode.size (docs/primitives/bytecode/size.mdx)", () => {
	describe("Basic Usage", () => {
		it("should return bytecode size", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x600100");

			expect(code.size()).toBe(3);
		});

		it("should return 0 for empty bytecode", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x");

			expect(code.size()).toBe(0);
		});

		it("should match length property", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			const code = Bytecode("0x6080604052600436");

			expect(code.size()).toBe(code.length);
		});
	});

	describe("EIP-170 Contract Size Limit", () => {
		it("should handle maximum contract size (24KB)", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// EIP-170 limit is 24576 bytes
			const maxSize = 24576;
			const largeCode = Bytecode(new Uint8Array(maxSize).fill(0x00));

			expect(largeCode.size()).toBe(maxSize);
		});
	});

	describe("Size Calculations", () => {
		it("should count PUSH data in size", async () => {
			const { Bytecode } = await import(
				"../../../src/primitives/Bytecode/index.js"
			);

			// PUSH32 + 32 bytes data = 33 bytes total
			const push32 = Bytecode("0x7f" + "ff".repeat(32));

			expect(push32.size()).toBe(33);
		});
	});
});
