/**
 * Comprehensive tests for function encoding/decoding
 * Tests function selectors, calldata encoding, return value decoding
 */

import { describe, expect, it } from "vitest";
import type { Address } from "../Address/index.js";
import * as Abi from "./index.js";
import type { Function as AbiFunction } from "./types.js";

// ============================================================================
// Function Signature Tests
// ============================================================================

describe("Abi.Function.getSignature", () => {
	it("generates signature for function with no params", () => {
		const func: AbiFunction = {
			type: "function",
			name: "totalSupply",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};
		expect(Abi.Function.getSignature(func)).toBe("totalSupply()");
	});

	it("generates signature for ERC20 transfer", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};
		expect(Abi.Function.getSignature(func)).toBe("transfer(address,uint256)");
	});

	it("generates signature for ERC20 balanceOf", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		};
		expect(Abi.Function.getSignature(func)).toBe("balanceOf(address)");
	});

	it("generates signature for ERC20 approve", () => {
		const func: AbiFunction = {
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};
		expect(Abi.Function.getSignature(func)).toBe("approve(address,uint256)");
	});

	it("generates signature with tuple", () => {
		const func: AbiFunction = {
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
		expect(Abi.Function.getSignature(func)).toBe("swap(tuple)");
	});

	it("generates signature with arrays", () => {
		const func: AbiFunction = {
			type: "function",
			name: "batchTransfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address[]", name: "recipients" },
				{ type: "uint256[]", name: "amounts" },
			],
			outputs: [],
		};
		expect(Abi.Function.getSignature(func)).toBe(
			"batchTransfer(address[],uint256[])",
		);
	});

	it("generates signature with multiple types", () => {
		const func: AbiFunction = {
			type: "function",
			name: "complex",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint256", name: "a" },
				{ type: "address", name: "b" },
				{ type: "bool", name: "c" },
				{ type: "bytes", name: "d" },
				{ type: "string", name: "e" },
			],
			outputs: [],
		};
		expect(Abi.Function.getSignature(func)).toBe(
			"complex(uint256,address,bool,bytes,string)",
		);
	});
});

// ============================================================================
// Function Selector Tests
// ============================================================================

describe("Abi.Function.getSelector", () => {
	it("computes selector for ERC20 transfer", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(4);

		// transfer(address,uint256) = 0xa9059cbb
		expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
	});

	it("computes selector for ERC20 balanceOf", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector.length).toBe(4);

		// balanceOf(address) = 0x70a08231
		expect(Array.from(selector)).toEqual([0x70, 0xa0, 0x82, 0x31]);
	});

	it("computes selector for ERC20 approve", () => {
		const func: AbiFunction = {
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector.length).toBe(4);

		// approve(address,uint256) = 0x095ea7b3
		expect(Array.from(selector)).toEqual([0x09, 0x5e, 0xa7, 0xb3]);
	});

	it("computes selector for totalSupply", () => {
		const func: AbiFunction = {
			type: "function",
			name: "totalSupply",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector.length).toBe(4);

		// totalSupply() = 0x18160ddd
		expect(Array.from(selector)).toEqual([0x18, 0x16, 0x0d, 0xdd]);
	});

	it("computes selector for transferFrom", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transferFrom",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector.length).toBe(4);

		// transferFrom(address,address,uint256) = 0x23b872dd
		expect(Array.from(selector)).toEqual([0x23, 0xb8, 0x72, 0xdd]);
	});

	it("computes selector for custom function", () => {
		const func: AbiFunction = {
			type: "function",
			name: "customFunction",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint256", name: "value" },
				{ type: "address", name: "user" },
			],
			outputs: [],
		};

		const selector = Abi.Function.getSelector(func);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(4);
	});
});

// ============================================================================
// Function calldata Encoding Tests
// ============================================================================

describe("Abi.Function.encodeParams", () => {
	it("encodes ERC20 transfer calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount = 1000000000000000000n;

		const calldata = Abi.Function.encodeParams(func, [to, amount]);

		expect(calldata).toBeInstanceOf(Uint8Array);
		// 4 bytes selector + 64 bytes params (2 * 32)
		expect(calldata.length).toBe(68);

		// Check selector (transfer(address,uint256) = 0xa9059cbb)
		expect(Array.from(calldata.slice(0, 4))).toEqual([0xa9, 0x05, 0x9c, 0xbb]);
	});

	it("encodes balanceOf calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		};

		const account = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const calldata = Abi.Function.encodeParams(func, [account]);

		expect(calldata.length).toBe(36); // 4 + 32
		expect(Array.from(calldata.slice(0, 4))).toEqual([0x70, 0xa0, 0x82, 0x31]);
	});

	it("encodes totalSupply calldata (no params)", () => {
		const func: AbiFunction = {
			type: "function",
			name: "totalSupply",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};

		const calldata = Abi.Function.encodeParams(func, []);

		expect(calldata.length).toBe(4); // Only selector
		expect(Array.from(calldata)).toEqual([0x18, 0x16, 0x0d, 0xdd]);
	});

	it("encodes approve calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const spender = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

		const calldata = Abi.Function.encodeParams(func, [spender, amount]);

		expect(calldata.length).toBe(68);
		expect(Array.from(calldata.slice(0, 4))).toEqual([0x09, 0x5e, 0xa7, 0xb3]);
		// Check that last 32 bytes are all 0xff (max uint256)
		expect(calldata.slice(36).every((b) => b === 0xff)).toBe(true);
	});

	it("encodes transferFrom calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transferFrom",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const from = "0x0000000000000000000000000000000000000001" as Address;
		const to = "0x0000000000000000000000000000000000000002" as Address;
		const amount = 500n;

		const calldata = Abi.Function.encodeParams(func, [from, to, amount]);

		expect(calldata.length).toBe(100); // 4 + 96 (3 * 32)
		expect(Array.from(calldata.slice(0, 4))).toEqual([0x23, 0xb8, 0x72, 0xdd]);
	});

	it("encodes function with dynamic types", () => {
		const func: AbiFunction = {
			type: "function",
			name: "setData",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint256", name: "id" },
				{ type: "bytes", name: "data" },
			],
			outputs: [],
		};

		const id = 42n;
		const data = "0x123456";

		const calldata = Abi.Function.encodeParams(func, [id, data]);

		expect(calldata).toBeInstanceOf(Uint8Array);
		expect(calldata.length).toBeGreaterThan(4);
		// First 4 bytes are selector
		expect(calldata.slice(0, 4).length).toBe(4);
	});

	it("encodes function with tuple", () => {
		const func: AbiFunction = {
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

		const params = [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			1000000000000000000n,
		];

		const calldata = Abi.Function.encodeParams(func, [params]);

		expect(calldata).toBeInstanceOf(Uint8Array);
		expect(calldata.length).toBeGreaterThan(4);
	});
});

// ============================================================================
// Function Result Encoding Tests
// ============================================================================

describe("Abi.Function.encodeResult", () => {
	it("encodes bool return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [{ type: "bool" }],
		};

		const encoded = Abi.Function.encodeResult(func, [true]);

		expect(encoded).toBeInstanceOf(Uint8Array);
		expect(encoded.length).toBe(32);
		expect(encoded[31]).toBe(1);
	});

	it("encodes uint256 return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};

		const balance = 1000000000000000000n;
		const encoded = Abi.Function.encodeResult(func, [balance]);

		expect(encoded.length).toBe(32);
	});

	it("encodes multiple return values", () => {
		const func: AbiFunction = {
			type: "function",
			name: "getReserves",
			stateMutability: "view",
			inputs: [],
			outputs: [
				{ type: "uint112", name: "reserve0" },
				{ type: "uint112", name: "reserve1" },
				{ type: "uint32", name: "blockTimestampLast" },
			],
		};

		const encoded = Abi.Function.encodeResult(func, [1000n, 2000n, 12345678n]);

		expect(encoded.length).toBe(96); // 3 * 32
	});

	it("encodes address return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "owner",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "address" }],
		};

		const owner = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.Function.encodeResult(func, [owner]);

		expect(encoded.length).toBe(32);
	});
});

// ============================================================================
// Function calldata Decoding Tests
// ============================================================================

describe("Abi.Function.decodeParams", () => {
	it("decodes transfer calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const amount = 1000000000000000000n;

		const calldata = Abi.Function.encodeParams(func, [to, amount]);
		const decoded = Abi.Function.decodeParams(func, calldata);

		expect(decoded).toHaveLength(2);
		expect(String(decoded[0]).toLowerCase()).toBe(to.toLowerCase());
		expect(decoded[1]).toBe(amount);
	});

	it("decodes balanceOf calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		};

		const account = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;

		const calldata = Abi.Function.encodeParams(func, [account]);
		const decoded = Abi.Function.decodeParams(func, calldata);

		expect(decoded).toHaveLength(1);
		expect(String(decoded[0]).toLowerCase()).toBe(account.toLowerCase());
	});

	it("decodes totalSupply calldata (no params)", () => {
		const func: AbiFunction = {
			type: "function",
			name: "totalSupply",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};

		const calldata = Abi.Function.encodeParams(func, []);
		const decoded = Abi.Function.decodeParams(func, calldata);

		expect(decoded).toEqual([]);
	});
});

// ============================================================================
// Function Result Decoding Tests
// ============================================================================

describe("Abi.Function.decodeResult", () => {
	it("decodes bool return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [{ type: "bool" }],
		};

		const encoded = Abi.Function.encodeResult(func, [true]);
		const decoded = Abi.Function.decodeResult(func, encoded);

		expect(decoded).toEqual([true]);
	});

	it("decodes uint256 return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }],
		};

		const balance = 1000000000000000000n;
		const encoded = Abi.Function.encodeResult(func, [balance]);
		const decoded = Abi.Function.decodeResult(func, encoded);

		expect(decoded).toEqual([balance]);
	});

	it("decodes multiple return values", () => {
		const func: AbiFunction = {
			type: "function",
			name: "getReserves",
			stateMutability: "view",
			inputs: [],
			outputs: [
				{ type: "uint112", name: "reserve0" },
				{ type: "uint112", name: "reserve1" },
				{ type: "uint32", name: "blockTimestampLast" },
			],
		};

		const values = [1000n, 2000n, 12345678n];
		const encoded = Abi.Function.encodeResult(func, values);
		const decoded = Abi.Function.decodeResult(func, encoded);

		expect(decoded).toEqual(values);
	});

	it("decodes address return value", () => {
		const func: AbiFunction = {
			type: "function",
			name: "owner",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "address" }],
		};

		const owner = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const encoded = Abi.Function.encodeResult(func, [owner]);
		const decoded = Abi.Function.decodeResult(func, encoded);

		expect(String(decoded[0]).toLowerCase()).toBe(owner.toLowerCase());
	});
});

// ============================================================================
// Round-Trip Tests
// ============================================================================

describe("Abi.Function round-trip encoding/decoding", () => {
	it("round-trips transfer calldata", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const original = [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			1000000000000000000n,
		];

		const encoded = Abi.Function.encodeParams(func, original);
		const decoded = Abi.Function.decodeParams(func, encoded);

		expect(String(decoded[0]).toLowerCase()).toBe(
			String(original[0]).toLowerCase(),
		);
		expect(decoded[1]).toBe(original[1]);
	});

	it("round-trips return values", () => {
		const func: AbiFunction = {
			type: "function",
			name: "getData",
			stateMutability: "view",
			inputs: [],
			outputs: [{ type: "uint256" }, { type: "address" }, { type: "bool" }],
		};

		const original = [42n, "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", true];

		const encoded = Abi.Function.encodeResult(func, original);
		const decoded = Abi.Function.decodeResult(func, encoded);

		expect(decoded[0]).toBe(original[0]);
		expect(String(decoded[1]).toLowerCase()).toBe(
			String(original[1]).toLowerCase(),
		);
		expect(decoded[2]).toBe(original[2]);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Abi.Function - edge cases", () => {
	it("handles function with no inputs or outputs", () => {
		const func: AbiFunction = {
			type: "function",
			name: "trigger",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [],
		};

		const calldata = Abi.Function.encodeParams(func, []);
		expect(calldata.length).toBe(4); // Only selector

		const decoded = Abi.Function.decodeParams(func, calldata);
		expect(decoded).toEqual([]);
	});

	it("handles zero values", () => {
		const func: AbiFunction = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const calldata = Abi.Function.encodeParams(func, [
			"0x0000000000000000000000000000000000000000",
			0n,
		]);

		const decoded = Abi.Function.decodeParams(func, calldata);
		expect(decoded[1]).toBe(0n);
	});

	it("handles max uint256", () => {
		const func: AbiFunction = {
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		};

		const max =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
		const calldata = Abi.Function.encodeParams(func, [
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			max,
		]);

		const decoded = Abi.Function.decodeParams(func, calldata);
		expect(decoded[1]).toBe(max);
	});
});
