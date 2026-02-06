import { describe, expect, it } from "vitest";
import * as InitCode from "./index.js";

describe("InitCode", () => {
	describe("from", () => {
		it("creates from hex string", () => {
			const code = InitCode.from("0x608060405234801561001057600080fd5b50");
			expect(code).toBeInstanceOf(Uint8Array);
			expect(code.length).toBeGreaterThan(0);
		});

		it("creates from Uint8Array", () => {
			const bytes = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]);
			const code = InitCode.from(bytes);
			expect(code).toBeInstanceOf(Uint8Array);
			expect(code.length).toBe(5);
		});
	});

	describe("fromHex", () => {
		it("creates from hex string", () => {
			const code = InitCode.fromHex("0x608060405234801561001057600080fd5b50");
			expect(code).toBeInstanceOf(Uint8Array);
			expect(code[0]).toBe(0x60);
		});
	});

	describe("toHex", () => {
		it("converts to hex string", () => {
			const code = InitCode.from("0x6080604052");
			const hex = InitCode.toHex(code);
			expect(hex).toBe("0x6080604052");
		});
	});

	describe("equals", () => {
		it("returns true for equal bytecode", () => {
			const code1 = InitCode.from("0x6080604052");
			const code2 = InitCode.from("0x6080604052");
			expect(InitCode.equals(code1, code2)).toBe(true);
		});

		it("returns false for different bytecode", () => {
			const code1 = InitCode.from("0x6080604052");
			const code2 = InitCode.from("0x6080604053");
			expect(InitCode.equals(code1, code2)).toBe(false);
		});
	});

	describe("extractRuntime", () => {
		it("extracts runtime code from offset", () => {
			const init = InitCode.from(
				new Uint8Array([...new Array(20).fill(0x60), 0x60, 0x01]),
			);
			const runtime = InitCode.extractRuntime(init, 20);
			expect(runtime.length).toBe(2);
			expect(runtime[0]).toBe(0x60);
			expect(runtime[1]).toBe(0x01);
		});

		it("handles offset 0", () => {
			const init = InitCode.from("0x6001600155");
			const runtime = InitCode.extractRuntime(init, 0);
			expect(runtime.length).toBe(init.length);
		});
	});

	describe("estimateGas", () => {
		it("estimates gas for contract creation", () => {
			const init = InitCode.from("0x6001600155");
			const gas = InitCode.estimateGas(init);
			// 21000 (base) + 32000 (create) + 5 * 16 (non-zero bytes) = 53080
			expect(gas).toBe(53080n);
		});

		it("accounts for zero bytes", () => {
			const init = InitCode.from("0x60006000");
			const gas = InitCode.estimateGas(init);
			// 21000 + 32000 + 2*16 (0x60) + 2*4 (0x00) = 53040
			expect(gas).toBe(53040n);
		});

		it("handles empty bytecode", () => {
			const init = InitCode.from("0x");
			const gas = InitCode.estimateGas(init);
			expect(gas).toBe(53000n); // 21000 + 32000
		});
	});
});
