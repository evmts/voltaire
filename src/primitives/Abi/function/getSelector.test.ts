/**
 * Unit tests for GetSelector factory and getSelector function
 */

import { describe, expect, it } from "vitest";
import { GetSelector, getSelector } from "./index.js";

describe("getSelector", () => {
	describe("basic selector generation", () => {
		it("generates selector for function with no inputs", () => {
			const func = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
		});

		it("generates selector for function with single input", () => {
			const func = {
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const selector = getSelector(func);
			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
		});

		it("generates selector for function with multiple inputs", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const selector = getSelector(func);
			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
		});
	});

	describe("known selector values", () => {
		it("generates correct selector for ERC20 transfer", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "recipient" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const selector = getSelector(func);
			// transfer(address,uint256) = 0xa9059cbb
			expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
		});

		it("generates correct selector for ERC20 approve", () => {
			const func = {
				type: "function",
				name: "approve",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "spender" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const selector = getSelector(func);
			// approve(address,uint256) = 0x095ea7b3
			expect(Array.from(selector)).toEqual([0x09, 0x5e, 0xa7, 0xb3]);
		});

		it("generates correct selector for ERC20 transferFrom", () => {
			const func = {
				type: "function",
				name: "transferFrom",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "sender" },
					{ type: "address", name: "recipient" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const selector = getSelector(func);
			// transferFrom(address,address,uint256) = 0x23b872dd
			expect(Array.from(selector)).toEqual([0x23, 0xb8, 0x72, 0xdd]);
		});

		it("generates correct selector for ERC20 balanceOf", () => {
			const func = {
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const selector = getSelector(func);
			// balanceOf(address) = 0x70a08231
			expect(Array.from(selector)).toEqual([0x70, 0xa0, 0x82, 0x31]);
		});
	});

	describe("different parameter types", () => {
		it("generates selector for function with array parameter", () => {
			const func = {
				type: "function",
				name: "processArray",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256[]", name: "data" }],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});

		it("generates selector for function with tuple parameter", () => {
			const func = {
				type: "function",
				name: "processTuple",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						name: "data",
						components: [
							{ type: "address", name: "addr" },
							{ type: "uint256", name: "value" },
						],
					},
				],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});

		it("generates selector for function with bytes parameter", () => {
			const func = {
				type: "function",
				name: "processBytes",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes", name: "data" }],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});

		it("generates selector for function with string parameter", () => {
			const func = {
				type: "function",
				name: "processString",
				stateMutability: "nonpayable",
				inputs: [{ type: "string", name: "text" }],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});
	});

	describe("selector consistency", () => {
		it("generates same selector for same function signature", () => {
			const func1 = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [{ type: "address", name: "param1" }],
				outputs: [],
			} as const;

			const func2 = {
				type: "function",
				name: "test",
				stateMutability: "view",
				inputs: [{ type: "address", name: "param2" }],
				outputs: [{ type: "bool", name: "" }],
			} as const;

			const selector1 = getSelector(func1);
			const selector2 = getSelector(func2);

			expect(Array.from(selector1)).toEqual(Array.from(selector2));
		});

		it("generates different selectors for different function names", () => {
			const func1 = {
				type: "function",
				name: "test1",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			const func2 = {
				type: "function",
				name: "test2",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			const selector1 = getSelector(func1);
			const selector2 = getSelector(func2);

			expect(Array.from(selector1)).not.toEqual(Array.from(selector2));
		});

		it("generates different selectors for different input types", () => {
			const func1 = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [{ type: "address", name: "param" }],
				outputs: [],
			} as const;

			const func2 = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "param" }],
				outputs: [],
			} as const;

			const selector1 = getSelector(func1);
			const selector2 = getSelector(func2);

			expect(Array.from(selector1)).not.toEqual(Array.from(selector2));
		});
	});

	describe("GetSelector factory", () => {
		it("creates getSelector function with custom keccak256String", () => {
			const mockKeccak = (str: string) => {
				const result = new Uint8Array(32);
				for (let i = 0; i < str.length && i < 32; i++) {
					result[i] = str.charCodeAt(i);
				}
				return result;
			};

			const customGetSelector = GetSelector({ keccak256String: mockKeccak });

			const func = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			const selector = customGetSelector(func);
			expect(selector.length).toBe(4);
		});

		it("factory pattern allows dependency injection", () => {
			let callCount = 0;
			const countingKeccak = (str: string) => {
				callCount++;
				const result = new Uint8Array(32);
				return result;
			};

			const customGetSelector = GetSelector({
				keccak256String: countingKeccak,
			});

			const func = {
				type: "function",
				name: "test",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			} as const;

			customGetSelector(func);
			expect(callCount).toBe(1);

			customGetSelector(func);
			expect(callCount).toBe(2);
		});
	});

	describe("different state mutabilities", () => {
		it("generates selector for view function", () => {
			const func = {
				type: "function",
				name: "getValue",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});

		it("generates selector for pure function", () => {
			const func = {
				type: "function",
				name: "calculate",
				stateMutability: "pure",
				inputs: [{ type: "uint256", name: "a" }],
				outputs: [{ type: "uint256", name: "" }],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});

		it("generates selector for payable function", () => {
			const func = {
				type: "function",
				name: "deposit",
				stateMutability: "payable",
				inputs: [],
				outputs: [],
			} as const;

			const selector = getSelector(func);
			expect(selector.length).toBe(4);
		});
	});
});
