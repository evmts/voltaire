import { describe, it, expect } from "vitest";
import { format } from "./format.js";

describe("format", () => {
	describe("function formatting", () => {
		it("formats function with inputs and outputs", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool", name: "success" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function transfer(address to, uint256 amount) returns (bool)",
			);
		});

		it("formats function with no outputs", () => {
			const func = {
				type: "function",
				name: "burn",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "amount" }],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function burn(uint256 amount)");
		});

		it("formats function with no inputs", () => {
			const func = {
				type: "function",
				name: "totalSupply",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256", name: "" }],
			};
			const formatted = format(func);
			expect(formatted).toBe("function totalSupply() returns (uint256) view");
		});

		it("formats function with no inputs or outputs", () => {
			const func = {
				type: "function",
				name: "pause",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function pause()");
		});

		it("formats parameters without names", () => {
			const func = {
				type: "function",
				name: "swap",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }, { type: "address" }],
				outputs: [{ type: "bool" }],
			};
			const formatted = format(func);
			expect(formatted).toBe("function swap(uint256, address) returns (bool)");
		});

		it("includes parameter names when present", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "recipient" },
					{ type: "uint256", name: "value" },
				],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function transfer(address recipient, uint256 value)",
			);
		});
	});

	describe("state mutability", () => {
		it("includes view state mutability", () => {
			const func = {
				type: "function",
				name: "balanceOf",
				stateMutability: "view",
				inputs: [{ type: "address", name: "account" }],
				outputs: [{ type: "uint256" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function balanceOf(address account) returns (uint256) view",
			);
		});

		it("includes pure state mutability", () => {
			const func = {
				type: "function",
				name: "calculate",
				stateMutability: "pure",
				inputs: [{ type: "uint256" }],
				outputs: [{ type: "uint256" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function calculate(uint256) returns (uint256) pure",
			);
		});

		it("includes payable state mutability", () => {
			const func = {
				type: "function",
				name: "deposit",
				stateMutability: "payable",
				inputs: [],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function deposit() payable");
		});

		it("omits nonpayable state mutability", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function transfer()");
		});
	});

	describe("event formatting", () => {
		it("formats event with indexed parameters", () => {
			const event = {
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			};
			const formatted = format(event);
			expect(formatted).toBe(
				"event Transfer(address from, address to, uint256 value)",
			);
		});

		it("formats event with no parameters", () => {
			const event = {
				type: "event",
				name: "Paused",
				inputs: [],
			};
			const formatted = format(event);
			expect(formatted).toBe("event Paused()");
		});

		it("formats event without parameter names", () => {
			const event = {
				type: "event",
				name: "Log",
				inputs: [{ type: "uint256" }, { type: "bytes32" }],
			};
			const formatted = format(event);
			expect(formatted).toBe("event Log(uint256, bytes32)");
		});
	});

	describe("error formatting", () => {
		it("formats error with parameters", () => {
			const error = {
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "available" },
					{ type: "uint256", name: "required" },
				],
			};
			const formatted = format(error);
			expect(formatted).toBe(
				"error InsufficientBalance(uint256 available, uint256 required)",
			);
		});

		it("formats error with no parameters", () => {
			const error = {
				type: "error",
				name: "Unauthorized",
				inputs: [],
			};
			const formatted = format(error);
			expect(formatted).toBe("error Unauthorized()");
		});

		it("formats error without parameter names", () => {
			const error = {
				type: "error",
				name: "CustomError",
				inputs: [{ type: "address" }, { type: "uint256" }],
			};
			const formatted = format(error);
			expect(formatted).toBe("error CustomError(address, uint256)");
		});
	});

	describe("constructor formatting", () => {
		it("formats constructor with parameters", () => {
			const constructor = {
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "uint256", name: "initialSupply" },
					{ type: "string", name: "name" },
				],
			};
			const formatted = format(constructor);
			expect(formatted).toBe(
				"constructor constructor(uint256 initialSupply, string name)",
			);
		});

		it("formats constructor with no parameters", () => {
			const constructor = {
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			};
			const formatted = format(constructor);
			expect(formatted).toBe("constructor constructor()");
		});

		it("includes payable state mutability for constructor", () => {
			const constructor = {
				type: "constructor",
				stateMutability: "payable",
				inputs: [],
			};
			const formatted = format(constructor);
			expect(formatted).toBe("constructor constructor() payable");
		});
	});

	describe("special functions", () => {
		it("formats fallback function", () => {
			const fallback = {
				type: "fallback",
				stateMutability: "payable",
			};
			const formatted = format(fallback);
			expect(formatted).toBe("fallback");
		});

		it("formats receive function", () => {
			const receive = {
				type: "receive",
				stateMutability: "payable",
			};
			const formatted = format(receive);
			expect(formatted).toBe("receive");
		});
	});

	describe("complex types", () => {
		it("formats function with array parameters", () => {
			const func = {
				type: "function",
				name: "batchTransfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address[]", name: "recipients" },
					{ type: "uint256[]", name: "amounts" },
				],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function batchTransfer(address[] recipients, uint256[] amounts)",
			);
		});

		it("formats function with tuple parameter", () => {
			const func = {
				type: "function",
				name: "swap",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						name: "params",
						components: [
							{ type: "address", name: "tokenIn" },
							{ type: "uint256", name: "amountIn" },
						],
					},
				],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function swap(tuple params)");
		});

		it("formats function with bytes parameter", () => {
			const func = {
				type: "function",
				name: "execute",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes", name: "data" }],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function execute(bytes data)");
		});

		it("formats function with fixed bytes parameter", () => {
			const func = {
				type: "function",
				name: "verify",
				stateMutability: "pure",
				inputs: [{ type: "bytes32", name: "hash" }],
				outputs: [{ type: "bool" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function verify(bytes32 hash) returns (bool) pure",
			);
		});

		it("formats function with string parameter", () => {
			const func = {
				type: "function",
				name: "setName",
				stateMutability: "nonpayable",
				inputs: [{ type: "string", name: "newName" }],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function setName(string newName)");
		});
	});

	describe("multiple outputs", () => {
		it("formats function with multiple return values", () => {
			const func = {
				type: "function",
				name: "getData",
				stateMutability: "view",
				inputs: [],
				outputs: [{ type: "uint256" }, { type: "string" }, { type: "bool" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function getData() returns (uint256, string, bool) view",
			);
		});

		it("formats function with named return values", () => {
			const func = {
				type: "function",
				name: "getInfo",
				stateMutability: "view",
				inputs: [],
				outputs: [
					{ type: "uint256", name: "balance" },
					{ type: "bool", name: "active" },
				],
			};
			const formatted = format(func);
			expect(formatted).toBe("function getInfo() returns (uint256, bool) view");
		});
	});

	describe("edge cases", () => {
		it("handles item with no name field", () => {
			const fallback = {
				type: "fallback",
				stateMutability: "payable",
			};
			const formatted = format(fallback);
			expect(formatted).toBe("fallback");
		});

		it("handles empty inputs array", () => {
			const func = {
				type: "function",
				name: "test",
				stateMutability: "pure",
				inputs: [],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe("function test()");
		});

		it("handles mixed named and unnamed parameters", () => {
			const func = {
				type: "function",
				name: "mixed",
				stateMutability: "pure",
				inputs: [
					{ type: "uint256", name: "first" },
					{ type: "address" },
					{ type: "bool", name: "last" },
				],
				outputs: [],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function mixed(uint256 first, address, bool last)",
			);
		});
	});

	describe("real-world examples", () => {
		it("formats ERC20 transfer", () => {
			const func = {
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			};
			const formatted = format(func);
			expect(formatted).toBe(
				"function transfer(address to, uint256 amount) returns (bool)",
			);
		});

		it("formats ERC20 Transfer event", () => {
			const event = {
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			};
			const formatted = format(event);
			expect(formatted).toBe(
				"event Transfer(address from, address to, uint256 value)",
			);
		});

		it("formats ERC20 Approval event", () => {
			const event = {
				type: "event",
				name: "Approval",
				inputs: [
					{ type: "address", name: "owner", indexed: true },
					{ type: "address", name: "spender", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			};
			const formatted = format(event);
			expect(formatted).toBe(
				"event Approval(address owner, address spender, uint256 value)",
			);
		});
	});
});
