import { describe, expect, it } from "vitest";
import * as FunctionSignature from "./index.js";
import * as Selector from "../Selector/index.js";

describe("FunctionSignature", () => {
	describe("from", () => {
		it("creates from string signature", () => {
			const sig = FunctionSignature.from("transfer(address,uint256)");
			expect(sig.name).toBe("transfer");
			expect(sig.inputs).toEqual(["address", "uint256"]);
			expect(sig.signature).toBe("transfer(address,uint256)");
			expect(FunctionSignature.toHex(sig)).toBe("0xa9059cbb");
		});

		it("creates from selector", () => {
			const selector = Selector.fromHex("0xa9059cbb");
			const sig = FunctionSignature.from(selector);
			expect(sig.selector).toEqual(selector);
			expect(sig.name).toBe("");
			expect(sig.inputs).toEqual([]);
		});

		it("handles function with no params", () => {
			const sig = FunctionSignature.from("totalSupply()");
			expect(sig.name).toBe("totalSupply");
			expect(sig.inputs).toEqual([]);
		});

		it("handles complex types", () => {
			const sig = FunctionSignature.from("swap(uint256,uint256,address,bytes)");
			expect(sig.name).toBe("swap");
			expect(sig.inputs).toEqual(["uint256", "uint256", "address", "bytes"]);
		});

		it("handles tuple types", () => {
			const sig = FunctionSignature.from("execute((address,uint256,bytes)[])");
			expect(sig.name).toBe("execute");
			expect(sig.inputs).toEqual(["(address,uint256,bytes)[]"]);
		});
	});

	describe("fromSignature", () => {
		it("creates from signature string", () => {
			const sig = FunctionSignature.fromSignature("balanceOf(address)");
			expect(sig.name).toBe("balanceOf");
			expect(sig.inputs).toEqual(["address"]);
			expect(FunctionSignature.toHex(sig)).toBe("0x70a08231");
		});
	});

	describe("parseSignature", () => {
		it("parses simple signature", () => {
			const { name, inputs } = FunctionSignature.parseSignature(
				"transfer(address,uint256)",
			);
			expect(name).toBe("transfer");
			expect(inputs).toEqual(["address", "uint256"]);
		});

		it("parses empty params", () => {
			const { name, inputs } =
				FunctionSignature.parseSignature("totalSupply()");
			expect(name).toBe("totalSupply");
			expect(inputs).toEqual([]);
		});

		it("parses tuple types", () => {
			const { name, inputs } = FunctionSignature.parseSignature(
				"swap((uint256,address),bytes)",
			);
			expect(name).toBe("swap");
			expect(inputs).toEqual(["(uint256,address)", "bytes"]);
		});

		it("throws on invalid signature", () => {
			expect(() => FunctionSignature.parseSignature("invalid")).toThrow(
				"Invalid function signature",
			);
		});
	});

	describe("toHex", () => {
		it("converts to hex string", () => {
			const sig = FunctionSignature.from("approve(address,uint256)");
			expect(FunctionSignature.toHex(sig)).toBe("0x095ea7b3");
		});
	});

	describe("equals", () => {
		it("returns true for equal selectors", () => {
			const sig1 = FunctionSignature.from("transfer(address,uint256)");
			const sig2 = FunctionSignature.from("transfer(address,uint256)");
			expect(FunctionSignature.equals(sig1, sig2)).toBe(true);
		});

		it("returns false for different selectors", () => {
			const sig1 = FunctionSignature.from("transfer(address,uint256)");
			const sig2 = FunctionSignature.from("approve(address,uint256)");
			expect(FunctionSignature.equals(sig1, sig2)).toBe(false);
		});
	});
});
