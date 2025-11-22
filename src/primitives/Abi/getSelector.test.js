import { describe, it, expect } from "vitest";
import { GetSelector } from "./getSelector.js";
import * as Keccak from "../../crypto/Keccak256/index.js";

describe("GetSelector", () => {
	const keccak256String = (str) => Keccak.hash(new TextEncoder().encode(str));
	const getSelector = GetSelector({ keccak256String });

	describe("function selectors", () => {
		it("computes selector for transfer(address,uint256)", () => {
			const selector = getSelector("transfer(address,uint256)");
			expect(selector).toBe("0xa9059cbb");
		});

		it("computes selector for approve(address,uint256)", () => {
			const selector = getSelector("approve(address,uint256)");
			expect(selector).toBe("0x095ea7b3");
		});

		it("computes selector for balanceOf(address)", () => {
			const selector = getSelector("balanceOf(address)");
			expect(selector).toBe("0x70a08231");
		});

		it("computes selector for totalSupply()", () => {
			const selector = getSelector("totalSupply()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
			expect(selector.length).toBe(10);
		});

		it("returns 4-byte selector for functions", () => {
			const selector = getSelector("test()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});
	});

	describe("event selectors", () => {
		it("computes selector for Transfer event", () => {
			const selector = getSelector("Transfer(address,address,uint256)", {
				type: "event",
			});
			expect(selector).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});

		it("computes selector for Approval event", () => {
			const selector = getSelector("Approval(address,address,uint256)", {
				type: "event",
			});
			expect(selector).toMatch(/^0x[0-9a-f]{64}$/);
			expect(selector.length).toBe(66);
		});

		it("returns 32-byte selector for events", () => {
			const selector = getSelector("TestEvent()", { type: "event" });
			expect(selector).toMatch(/^0x[0-9a-f]{64}$/);
			expect(selector.length).toBe(66);
		});
	});

	describe("error selectors", () => {
		it("computes selector for custom errors", () => {
			const selector = getSelector("InsufficientBalance(uint256,uint256)", {
				type: "error",
			});
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
			expect(selector.length).toBe(10);
		});

		it("returns 4-byte selector for errors", () => {
			const selector = getSelector("Unauthorized()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});
	});

	describe("default type", () => {
		it("defaults to function selector (4 bytes)", () => {
			const selector = getSelector("test()");
			expect(selector.length).toBe(10);
		});

		it("defaults to function when no options", () => {
			const selector = getSelector("transfer(address,uint256)");
			expect(selector).toBe("0xa9059cbb");
		});

		it("defaults to function when empty options", () => {
			const selector = getSelector("test()", {});
			expect(selector.length).toBe(10);
		});
	});

	describe("signature formats", () => {
		it("handles signature with no spaces", () => {
			const selector = getSelector("transfer(address,uint256)");
			expect(selector).toBe("0xa9059cbb");
		});

		it("handles complex parameter types", () => {
			const selector = getSelector("swap((address,uint256),address[])");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles nested tuples", () => {
			const selector = getSelector("complex((address,(uint256,bool)))");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles array types", () => {
			const selector = getSelector("batchTransfer(address[],uint256[])");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles fixed array types", () => {
			const selector = getSelector("test(uint256[3])");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles bytes types", () => {
			const selector = getSelector("execute(bytes)");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles fixed bytes types", () => {
			const selector = getSelector("verify(bytes32)");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles string types", () => {
			const selector = getSelector("setName(string)");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});
	});

	describe("known selectors", () => {
		const knownSelectors = [
			{ sig: "transfer(address,uint256)", expected: "0xa9059cbb" },
			{ sig: "approve(address,uint256)", expected: "0x095ea7b3" },
			{ sig: "balanceOf(address)", expected: "0x70a08231" },
		];

		for (const { sig, expected } of knownSelectors) {
			it(`computes correct selector for ${sig}`, () => {
				const selector = getSelector(sig);
				expect(selector).toBe(expected);
			});
		}
	});

	describe("event vs function selectors", () => {
		it("produces different selectors for same signature", () => {
			const funcSelector = getSelector("Test()");
			const eventSelector = getSelector("Test()", { type: "event" });
			expect(funcSelector.length).toBe(10);
			expect(eventSelector.length).toBe(66);
			expect(funcSelector).not.toBe(eventSelector);
		});

		it("uses full hash for events", () => {
			const eventSelector = getSelector("Transfer(address,address,uint256)", {
				type: "event",
			});
			expect(eventSelector.length).toBe(66);
			expect(eventSelector).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});

		it("uses first 4 bytes for functions", () => {
			const funcSelector = getSelector("transfer(address,uint256)");
			const eventSelector = getSelector("transfer(address,uint256)", {
				type: "event",
			});
			expect(funcSelector).toBe(eventSelector.slice(0, 10));
		});
	});

	describe("edge cases", () => {
		it("handles empty parameter list", () => {
			const selector = getSelector("test()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles single parameter", () => {
			const selector = getSelector("test(uint256)");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles many parameters", () => {
			const selector = getSelector(
				"test(uint256,uint256,uint256,uint256,uint256)",
			);
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles long function names", () => {
			const selector = getSelector("thisIsAVeryLongFunctionNameForTesting()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("handles single character function names", () => {
			const selector = getSelector("f()");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});
	});

	describe("real-world examples", () => {
		it("computes ERC20 function selectors", () => {
			const transfer = getSelector("transfer(address,uint256)");
			const approve = getSelector("approve(address,uint256)");
			const balanceOf = getSelector("balanceOf(address)");

			expect(transfer).toBe("0xa9059cbb");
			expect(approve).toBe("0x095ea7b3");
			expect(balanceOf).toBe("0x70a08231");
		});

		it("computes ERC20 event selectors", () => {
			const transfer = getSelector("Transfer(address,address,uint256)", {
				type: "event",
			});
			const approval = getSelector("Approval(address,address,uint256)", {
				type: "event",
			});

			expect(transfer).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
			expect(approval).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("computes UniswapV2 swap selector", () => {
			const selector = getSelector("swap(uint256,uint256,address,bytes)");
			expect(selector).toMatch(/^0x[0-9a-f]{8}$/);
		});
	});

	describe("determinism", () => {
		it("produces same selector for repeated calls", () => {
			const selector1 = getSelector("test()");
			const selector2 = getSelector("test()");
			expect(selector1).toBe(selector2);
		});

		it("produces consistent selectors", () => {
			const signature = "transfer(address,uint256)";
			const results = Array.from({ length: 10 }, () => getSelector(signature));
			const allSame = results.every((r) => r === results[0]);
			expect(allSame).toBe(true);
		});
	});

	describe("selector uniqueness", () => {
		it("different signatures produce different selectors", () => {
			const selector1 = getSelector("test1()");
			const selector2 = getSelector("test2()");
			expect(selector1).not.toBe(selector2);
		});

		it("different parameter types produce different selectors", () => {
			const selector1 = getSelector("test(uint256)");
			const selector2 = getSelector("test(address)");
			expect(selector1).not.toBe(selector2);
		});

		it("parameter order matters", () => {
			const selector1 = getSelector("test(uint256,address)");
			const selector2 = getSelector("test(address,uint256)");
			expect(selector1).not.toBe(selector2);
		});
	});

	describe("factory function", () => {
		it("returns function that can be called multiple times", () => {
			const getSelector = GetSelector({ keccak256String });
			const selector1 = getSelector("test()");
			const selector2 = getSelector("test()");
			expect(selector1).toBe(selector2);
		});

		it("allows custom keccak256 implementation", () => {
			const customKeccak = (str) => keccak256String(str);
			const customGetSelector = GetSelector({
				keccak256String: customKeccak,
			});
			const selector = customGetSelector("transfer(address,uint256)");
			expect(selector).toBe("0xa9059cbb");
		});
	});

	describe("output format", () => {
		it("returns hex string with 0x prefix", () => {
			const selector = getSelector("test()");
			expect(selector).toMatch(/^0x/);
		});

		it("returns lowercase hex", () => {
			const selector = getSelector("test()");
			expect(selector).toBe(selector.toLowerCase());
		});

		it("pads selector to correct length", () => {
			const selector = getSelector("test()");
			expect(selector.length).toBe(10);
		});

		it("event selector is 32 bytes", () => {
			const selector = getSelector("Test()", { type: "event" });
			expect(selector.length).toBe(66);
		});
	});
});
