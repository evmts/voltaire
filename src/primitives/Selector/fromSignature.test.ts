import { describe, expect, it } from "vitest";
import * as Selector from "./index.js";

describe("Selector.fromSignature", () => {
	describe("ERC-20 function signatures", () => {
		it("computes transfer(address,uint256)", () => {
			const selector = Selector.fromSignature("transfer(address,uint256)");
			expect(Selector.toHex(selector)).toBe("0xa9059cbb");
		});

		it("computes approve(address,uint256)", () => {
			const selector = Selector.fromSignature("approve(address,uint256)");
			expect(Selector.toHex(selector)).toBe("0x095ea7b3");
		});

		it("computes balanceOf(address)", () => {
			const selector = Selector.fromSignature("balanceOf(address)");
			expect(Selector.toHex(selector)).toBe("0x70a08231");
		});

		it("computes totalSupply()", () => {
			const selector = Selector.fromSignature("totalSupply()");
			expect(Selector.toHex(selector)).toBe("0x18160ddd");
		});

		it("computes allowance(address,address)", () => {
			const selector = Selector.fromSignature("allowance(address,address)");
			expect(Selector.toHex(selector)).toBe("0xdd62ed3e");
		});

		it("computes transferFrom(address,address,uint256)", () => {
			const selector = Selector.fromSignature(
				"transferFrom(address,address,uint256)",
			);
			expect(Selector.toHex(selector)).toBe("0x23b872dd");
		});
	});

	describe("ERC-721 function signatures", () => {
		it("computes safeTransferFrom(address,address,uint256)", () => {
			const selector = Selector.fromSignature(
				"safeTransferFrom(address,address,uint256)",
			);
			expect(Selector.toHex(selector)).toBe("0x42842e0e");
		});

		it("computes safeTransferFrom(address,address,uint256,bytes)", () => {
			const selector = Selector.fromSignature(
				"safeTransferFrom(address,address,uint256,bytes)",
			);
			expect(Selector.toHex(selector)).toBe("0xb88d4fde");
		});

		it("computes ownerOf(uint256)", () => {
			const selector = Selector.fromSignature("ownerOf(uint256)");
			expect(Selector.toHex(selector)).toBe("0x6352211e");
		});

		it("computes setApprovalForAll(address,bool)", () => {
			const selector = Selector.fromSignature(
				"setApprovalForAll(address,bool)",
			);
			expect(Selector.toHex(selector)).toBe("0xa22cb465");
		});
	});

	describe("function signatures with no parameters", () => {
		it("computes name()", () => {
			const selector = Selector.fromSignature("name()");
			expect(Selector.toHex(selector)).toBe("0x06fdde03");
		});

		it("computes symbol()", () => {
			const selector = Selector.fromSignature("symbol()");
			expect(Selector.toHex(selector)).toBe("0x95d89b41");
		});

		it("computes decimals()", () => {
			const selector = Selector.fromSignature("decimals()");
			expect(Selector.toHex(selector)).toBe("0x313ce567");
		});
	});

	describe("complex parameter types", () => {
		it("computes function with bytes parameter", () => {
			const selector = Selector.fromSignature(
				"swap(uint256,uint256,address,bytes)",
			);
			expect(Selector.toHex(selector)).toBe("0x022c0d9f");
		});

		it("computes function with multiple uint types", () => {
			const selector = Selector.fromSignature(
				"setValues(uint256,uint256,uint256)",
			);
			expect(Selector.toHex(selector)).toBe("0x111be316");
		});

		it("computes function with bool parameter", () => {
			const selector = Selector.fromSignature("setValue(uint256,bool)");
			expect(Selector.toHex(selector)).toBe("0x82e33e82");
		});

		it("computes function with bytes32 parameter", () => {
			const selector = Selector.fromSignature("verifyHash(bytes32)");
			expect(Selector.toHex(selector)).toBe("0xef020f4a");
		});
	});

	describe("consistency with other constructors", () => {
		it("matches fromHex for transfer", () => {
			const fromSig = Selector.fromSignature("transfer(address,uint256)");
			const fromHex = Selector.fromHex("0xa9059cbb");
			expect(Selector.equals(fromSig, fromHex)).toBe(true);
		});

		it("matches fromHex for approve", () => {
			const fromSig = Selector.fromSignature("approve(address,uint256)");
			const fromHex = Selector.fromHex("0x095ea7b3");
			expect(Selector.equals(fromSig, fromHex)).toBe(true);
		});

		it("matches fromHex for balanceOf", () => {
			const fromSig = Selector.fromSignature("balanceOf(address)");
			const fromHex = Selector.fromHex("0x70a08231");
			expect(Selector.equals(fromSig, fromHex)).toBe(true);
		});
	});

	describe("deterministic hashing", () => {
		it("produces same result for same signature", () => {
			const sel1 = Selector.fromSignature("transfer(address,uint256)");
			const sel2 = Selector.fromSignature("transfer(address,uint256)");
			expect(Selector.equals(sel1, sel2)).toBe(true);
		});

		it("produces different results for different signatures", () => {
			const sel1 = Selector.fromSignature("transfer(address,uint256)");
			const sel2 = Selector.fromSignature("approve(address,uint256)");
			expect(Selector.equals(sel1, sel2)).toBe(false);
		});
	});
});
