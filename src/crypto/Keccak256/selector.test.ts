import { describe, expect, it } from "vitest";
import { selector } from "./selector.js";
import { hashString } from "./hashString.js";

describe("Keccak256.selector", () => {
	describe("basic functionality", () => {
		it("should return 4-byte selector", () => {
			const result = selector("transfer(address,uint256)");

			expect(result.length).toBe(4);
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should extract first 4 bytes of hash", () => {
			const sig = "balanceOf(address)";

			const result = selector(sig);
			const fullHash = hashString(sig);

			expect(result).toEqual(fullHash.slice(0, 4));
		});
	});

	describe("known Ethereum function selectors", () => {
		it("should compute transfer(address,uint256) selector", () => {
			const result = selector("transfer(address,uint256)");

			// Known selector: 0xa9059cbb
			expect(result[0]).toBe(0xa9);
			expect(result[1]).toBe(0x05);
			expect(result[2]).toBe(0x9c);
			expect(result[3]).toBe(0xbb);
		});

		it("should compute approve(address,uint256) selector", () => {
			const result = selector("approve(address,uint256)");

			// Known selector: 0x095ea7b3
			expect(result[0]).toBe(0x09);
			expect(result[1]).toBe(0x5e);
			expect(result[2]).toBe(0xa7);
			expect(result[3]).toBe(0xb3);
		});

		it("should compute balanceOf(address) selector", () => {
			const result = selector("balanceOf(address)");

			// Known selector: 0x70a08231
			expect(result[0]).toBe(0x70);
			expect(result[1]).toBe(0xa0);
			expect(result[2]).toBe(0x82);
			expect(result[3]).toBe(0x31);
		});

		it("should compute totalSupply() selector", () => {
			const result = selector("totalSupply()");

			// Known selector: 0x18160ddd
			expect(result[0]).toBe(0x18);
			expect(result[1]).toBe(0x16);
			expect(result[2]).toBe(0x0d);
			expect(result[3]).toBe(0xdd);
		});

		it("should compute allowance(address,address) selector", () => {
			const result = selector("allowance(address,address)");

			// Known selector: 0xdd62ed3e
			expect(result[0]).toBe(0xdd);
			expect(result[1]).toBe(0x62);
			expect(result[2]).toBe(0xed);
			expect(result[3]).toBe(0x3e);
		});
	});

	describe("ERC20 function selectors", () => {
		it("should compute all ERC20 function selectors", () => {
			const erc20Functions = [
				"transfer(address,uint256)",
				"approve(address,uint256)",
				"transferFrom(address,address,uint256)",
				"balanceOf(address)",
				"allowance(address,address)",
				"totalSupply()",
			];

			for (const func of erc20Functions) {
				const result = selector(func);
				expect(result.length).toBe(4);
			}
		});
	});

	describe("ERC721 function selectors", () => {
		it("should compute safeTransferFrom selector", () => {
			const result = selector("safeTransferFrom(address,address,uint256)");

			// Known selector: 0x42842e0e
			expect(result[0]).toBe(0x42);
			expect(result[1]).toBe(0x84);
			expect(result[2]).toBe(0x2e);
			expect(result[3]).toBe(0x0e);
		});

		it("should compute ownerOf selector", () => {
			const result = selector("ownerOf(uint256)");

			// Known selector: 0x6352211e
			expect(result[0]).toBe(0x63);
			expect(result[1]).toBe(0x52);
			expect(result[2]).toBe(0x21);
			expect(result[3]).toBe(0x1e);
		});
	});

	describe("determinism", () => {
		it("should produce same selector for same signature", () => {
			const sig = "myFunction(uint256,address)";

			const selector1 = selector(sig);
			const selector2 = selector(sig);

			expect(selector1).toEqual(selector2);
		});

		it("should produce different selectors for different signatures", () => {
			const selector1 = selector("functionA()");
			const selector2 = selector("functionB()");

			expect(selector1).not.toEqual(selector2);
		});
	});

	describe("function signature formatting", () => {
		it("should handle no parameters", () => {
			const result = selector("getValue()");
			expect(result.length).toBe(4);
		});

		it("should handle single parameter", () => {
			const result = selector("setValue(uint256)");
			expect(result.length).toBe(4);
		});

		it("should handle multiple parameters", () => {
			const result = selector("complexFunction(uint256,address,bytes32,bool)");
			expect(result.length).toBe(4);
		});

		it("should handle array parameters", () => {
			const result = selector("batchTransfer(address[],uint256[])");
			expect(result.length).toBe(4);
		});

		it("should handle tuple parameters", () => {
			const result = selector("structFunction((uint256,address))");
			expect(result.length).toBe(4);
		});
	});

	describe("case sensitivity", () => {
		it("should be case-sensitive", () => {
			const selector1 = selector("test()");
			const selector2 = selector("Test()");
			const selector3 = selector("TEST()");

			expect(selector1).not.toEqual(selector2);
			expect(selector1).not.toEqual(selector3);
			expect(selector2).not.toEqual(selector3);
		});
	});

	describe("whitespace handling", () => {
		it("should be sensitive to spaces", () => {
			const selector1 = selector("function(uint256,address)");
			const selector2 = selector("function(uint256, address)");

			// Should be different due to space
			expect(selector1).not.toEqual(selector2);
		});

		it("should not trim input", () => {
			const selector1 = selector("test()");
			const selector2 = selector(" test()");

			expect(selector1).not.toEqual(selector2);
		});
	});

	describe("collision detection", () => {
		it("should produce unique selectors for different signatures", () => {
			const signatures = [
				"transfer(address,uint256)",
				"approve(address,uint256)",
				"balanceOf(address)",
				"totalSupply()",
				"mint(address,uint256)",
				"burn(uint256)",
			];

			const selectors = signatures.map((sig) => selector(sig));

			// Check all are unique
			const uniqueSelectors = new Set(selectors.map((s) => s.join(",")));

			expect(uniqueSelectors.size).toBe(signatures.length);
		});
	});

	describe("special function names", () => {
		it("should handle constructor-like names", () => {
			const result = selector("initialize(address)");
			expect(result.length).toBe(4);
		});

		it("should handle fallback-like names", () => {
			const result = selector("fallback()");
			expect(result.length).toBe(4);
		});

		it("should handle receive-like names", () => {
			const result = selector("receive()");
			expect(result.length).toBe(4);
		});
	});

	describe("cross-validation", () => {
		it("should match hashString first 4 bytes", () => {
			const signatures = [
				"test()",
				"myFunc(uint256)",
				"complex(address,bytes32,bool)",
			];

			for (const sig of signatures) {
				const sel = selector(sig);
				const fullHash = hashString(sig);

				expect(sel).toEqual(fullHash.slice(0, 4));
			}
		});
	});

	describe("edge cases", () => {
		it("should handle empty function name", () => {
			const result = selector("()");
			expect(result.length).toBe(4);
		});

		it("should handle very long function names", () => {
			const longName = "a".repeat(100);
			const result = selector(`${longName}(uint256)`);
			expect(result.length).toBe(4);
		});

		it("should handle complex nested types", () => {
			const result = selector("complex((uint256,address)[],bytes32,bool)");
			expect(result.length).toBe(4);
		});
	});

	describe("real-world examples", () => {
		it("should compute Uniswap swap selector", () => {
			const result = selector("swap(uint256,uint256,address,bytes)");
			expect(result.length).toBe(4);
		});

		it("should compute Compound borrow selector", () => {
			const result = selector("borrow(uint256)");
			expect(result.length).toBe(4);
		});

		it("should compute Aave deposit selector", () => {
			const result = selector("deposit(address,uint256,address,uint16)");
			expect(result.length).toBe(4);
		});
	});
});
