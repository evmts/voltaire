import { describe, expect, it } from "vitest";
import { formatWithArgs } from "./formatWithArgs.js";

/** @param {*} item @returns {import('./Item/ItemType.js').ItemType} */
const item = (item) => item;

describe("formatWithArgs", () => {
	describe("function formatting", () => {
		it("formats function call with arguments", () => {
			const func = item({
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				1000n,
			]);
			expect(formatted).toBe(
				"transfer(0x742d35cc6634c0532925a3b844bc9e7595f251e3, 1000)",
			);
		});

		it("formats function with no arguments", () => {
			const func = item({
				type: "function",
				name: "totalSupply",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256" }],
			});
			const formatted = formatWithArgs(func, []);
			expect(formatted).toBe("totalSupply()");
		});

		it("formats function with single argument", () => {
			const func = item({
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256" }],
			});
			const formatted = formatWithArgs(func, [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			]);
			expect(formatted).toBe(
				"balanceOf(0x742d35cc6634c0532925a3b844bc9e7595f251e3)",
			);
		});

		it("formats function with multiple arguments", () => {
			const func = item({
				type: "function",
				name: "approve",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "spender" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				500n,
			]);
			expect(formatted).toBe(
				"approve(0x742d35cc6634c0532925a3b844bc9e7595f251e3, 500)",
			);
		});
	});

	describe("event formatting", () => {
		it("formats event with indexed arguments", () => {
			const event = item({
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			});
			const formatted = formatWithArgs(event, [
				"0x0000000000000000000000000000000000000000",
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				1000n,
			]);
			expect(formatted).toContain("Transfer(");
			expect(formatted).toContain("1000");
		});

		it("formats event with no arguments", () => {
			const event = item({
				type: "event",
				name: "Paused",
				inputs: [],
			});
			const formatted = formatWithArgs(event, []);
			expect(formatted).toBe("Paused()");
		});
	});

	describe("error formatting", () => {
		it("formats error with arguments", () => {
			const error = item({
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "available" },
					{ type: "uint256", name: "required" },
				],
			});
			const formatted = formatWithArgs(error, [100n, 200n]);
			expect(formatted).toBe("InsufficientBalance(100, 200)");
		});

		it("formats error with no arguments", () => {
			const error = item({
				type: "error",
				name: "Unauthorized",
				inputs: [],
			});
			const formatted = formatWithArgs(error, []);
			expect(formatted).toBe("Unauthorized()");
		});
	});

	describe("argument types", () => {
		it("formats bigint arguments", () => {
			const func = item({
				type: "function",
				name: "test",
				stateMutability: "pure",
				inputs: [{ type: "uint256" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [1000000000000000000n]);
			expect(formatted).toBe("test(1000000000000000000)");
		});

		it("formats string arguments", () => {
			const func = item({
				type: "function",
				name: "setName",
				stateMutability: "nonpayable",
				inputs: [{ type: "string", name: "name" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, ["Alice"]);
			expect(formatted).toBe("setName(Alice)");
		});

		it("formats boolean arguments", () => {
			const func = item({
				type: "function",
				name: "setFlag",
				stateMutability: "nonpayable",
				inputs: [{ type: "bool", name: "flag" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [true]);
			expect(formatted).toBe("setFlag(true)");
		});

		it("formats address arguments", () => {
			const func = item({
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [{ type: "address" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			]);
			expect(formatted).toBe(
				"transfer(0x742d35cc6634c0532925a3b844bc9e7595f251e3)",
			);
		});

		it("formats number arguments", () => {
			const func = item({
				type: "function",
				name: "test",
				stateMutability: "pure",
				inputs: [{ type: "uint8" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [42]);
			expect(formatted).toBe("test(42)");
		});

		it("formats array arguments", () => {
			const func = item({
				type: "function",
				name: "batchTransfer",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256[]" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [[1n, 2n, 3n]]);
			expect(formatted).toContain("batchTransfer(");
			expect(formatted).toContain("1");
			expect(formatted).toContain("2");
			expect(formatted).toContain("3");
		});
	});

	describe("fallback cases", () => {
		it("falls back to format for items without name", () => {
			const fallback = item({
				type: "fallback",
				stateMutability: "payable",
			});
			const formatted = formatWithArgs(fallback, []);
			expect(formatted).toBe("fallback");
		});

		it("falls back to format for items without inputs", () => {
			const receive = item({
				type: "receive",
				stateMutability: "payable",
			});
			const formatted = formatWithArgs(receive, []);
			expect(formatted).toBe("receive");
		});
	});

	describe("edge cases", () => {
		it("handles empty string argument", () => {
			const func = item({
				type: "function",
				name: "setName",
				stateMutability: "nonpayable",
				inputs: [{ type: "string" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [""]);
			expect(formatted).toBe("setName()");
		});

		it("handles zero bigint argument", () => {
			const func = item({
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [0n]);
			expect(formatted).toBe("transfer(0)");
		});

		it("handles zero address argument", () => {
			const func = item({
				type: "function",
				name: "burn",
				stateMutability: "nonpayable",
				inputs: [{ type: "address" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0x0000000000000000000000000000000000000000",
			]);
			expect(formatted).toBe(
				"burn(0x0000000000000000000000000000000000000000)",
			);
		});

		it("handles false boolean argument", () => {
			const func = item({
				type: "function",
				name: "setFlag",
				stateMutability: "nonpayable",
				inputs: [{ type: "bool" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [false]);
			expect(formatted).toBe("setFlag(false)");
		});

		it("handles bytes argument", () => {
			const func = item({
				type: "function",
				name: "execute",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes" }],
				outputs: [],
			});
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const formatted = formatWithArgs(func, [bytes]);
			expect(formatted).toContain("execute(");
		});
	});

	describe("complex arguments", () => {
		it("formats function with multiple mixed type arguments", () => {
			const func = item({
				type: "function",
				name: "complex",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address" },
					{ type: "uint256" },
					{ type: "bool" },
					{ type: "string" },
				],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				1000n,
				true,
				"test",
			]);
			expect(formatted).toContain("complex(");
			expect(formatted).toContain("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(formatted).toContain("1000");
			expect(formatted).toContain("true");
			expect(formatted).toContain("test");
		});

		it("formats function with tuple argument", () => {
			const func = item({
				type: "function",
				name: "swap",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						components: [{ type: "address" }, { type: "uint256" }],
					},
				],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				{
					0: "0x742d35cc6634c0532925a3b844bc9e7595f251e3",
					1: 1000n,
				},
			]);
			expect(formatted).toContain("swap(");
		});
	});

	describe("real-world examples", () => {
		it("formats ERC20 transfer call", () => {
			const func = item({
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [
				"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
				1000000000000000000n,
			]);
			expect(formatted).toBe(
				"transfer(0xd8da6bf26964af9d7eed9e03e53415d37aa96045, 1000000000000000000)",
			);
		});

		it("formats ERC20 approve call", () => {
			const func = item({
				type: "function",
				name: "approve",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "spender" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [],
			});
			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const formatted = formatWithArgs(func, [
				"0x7a250d5630b4cf539939c1f07d1e3ea40f6063af",
				maxUint256,
			]);
			expect(formatted).toContain("approve(");
			expect(formatted).toContain("0x7a250d5630b4cf539939c1f07d1e3ea40f6063af");
		});

		it("formats Transfer event emission", () => {
			const event = item({
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			});
			const formatted = formatWithArgs(event, [
				"0x0000000000000000000000000000000000000000",
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				1000000000000000000n,
			]);
			expect(formatted).toContain("Transfer(");
			expect(formatted).toContain("1000000000000000000");
		});
	});

	describe("argument count mismatch", () => {
		it("handles more arguments than inputs", () => {
			const func = item({
				type: "function",
				name: "test",
				stateMutability: "pure",
				inputs: [{ type: "uint256" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [1n, 2n]);
			expect(formatted).toContain("test(");
		});

		it("handles fewer arguments than inputs", () => {
			const func = item({
				type: "function",
				name: "test",
				stateMutability: "pure",
				inputs: [{ type: "uint256" }, { type: "uint256" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, [1n]);
			expect(formatted).toContain("test(");
		});
	});

	describe("special characters in strings", () => {
		it("handles strings with spaces", () => {
			const func = item({
				type: "function",
				name: "setName",
				stateMutability: "nonpayable",
				inputs: [{ type: "string" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, ["Hello World"]);
			expect(formatted).toBe("setName(Hello World)");
		});

		it("handles strings with quotes", () => {
			const func = item({
				type: "function",
				name: "setText",
				stateMutability: "nonpayable",
				inputs: [{ type: "string" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, ['Test "quoted" text']);
			expect(formatted).toContain("setText(");
		});

		it("handles strings with commas", () => {
			const func = item({
				type: "function",
				name: "setText",
				stateMutability: "nonpayable",
				inputs: [{ type: "string" }],
				outputs: [],
			});
			const formatted = formatWithArgs(func, ["Hello, World"]);
			expect(formatted).toBe("setText(Hello, World)");
		});
	});
});
