import { describe, it, expect } from "vitest";
import { decodeData } from "./decodeData.js";
import { AbiInvalidSelectorError, AbiItemNotFoundError } from "./Errors.js";
import * as Function from "./function/index.js";

describe("decodeData", () => {
	const testAbi = [
		{
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [],
		},
		{
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256" }],
		},
		{
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		},
	];

	describe("basic decoding", () => {
		it("decodes transfer calldata", () => {
			const to = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 1000n;
			const calldata = Function.encodeParams(testAbi[0], [to, amount]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.functionName).toBe("transfer");
			expect(result.args).toEqual([to, amount]);
		});

		it("decodes balanceOf calldata", () => {
			const account = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const calldata = Function.encodeParams(testAbi[1], [account]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.functionName).toBe("balanceOf");
			expect(result.args).toEqual([account]);
		});

		it("decodes approve calldata", () => {
			const spender = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const amount = 999n;
			const calldata = Function.encodeParams(testAbi[2], [spender, amount]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.functionName).toBe("approve");
			expect(result.args).toEqual([spender, amount]);
		});
	});

	describe("function with no parameters", () => {
		it("decodes calldata with only selector", () => {
			const abi = [
				{
					type: "function",
					name: "totalSupply",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "uint256" }],
				},
			];
			const calldata = Function.encodeParams(abi[0], []);

			const result = decodeData.call(abi, calldata);
			expect(result.functionName).toBe("totalSupply");
			expect(result.args).toEqual([]);
		});
	});

	describe("selector matching", () => {
		it("matches function by selector", () => {
			const calldata = Function.encodeParams(testAbi[0], [
				"0x0000000000000000000000000000000000000000",
				100n,
			]);
			const selector = calldata.slice(0, 4);
			expect(Array.from(selector)).toEqual([0xa9, 0x05, 0x9c, 0xbb]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.functionName).toBe("transfer");
		});

		it("distinguishes between different selectors", () => {
			const transferCalldata = Function.encodeParams(testAbi[0], [
				"0x0000000000000000000000000000000000000000",
				100n,
			]);
			const approveCalldata = Function.encodeParams(testAbi[2], [
				"0x0000000000000000000000000000000000000000",
				100n,
			]);

			expect(transferCalldata.slice(0, 4)).not.toEqual(
				approveCalldata.slice(0, 4),
			);

			const result1 = decodeData.call(testAbi, transferCalldata);
			expect(result1.functionName).toBe("transfer");

			const result2 = decodeData.call(testAbi, approveCalldata);
			expect(result2.functionName).toBe("approve");
		});
	});

	describe("error cases", () => {
		it("throws when data is too short", () => {
			expect(() => {
				decodeData.call(testAbi, new Uint8Array(3));
			}).toThrow(AbiInvalidSelectorError);
		});

		it("throws when data is empty", () => {
			expect(() => {
				decodeData.call(testAbi, new Uint8Array(0));
			}).toThrow(AbiInvalidSelectorError);
		});

		it("throws with descriptive message for short data", () => {
			expect(() => {
				decodeData.call(testAbi, new Uint8Array(2));
			}).toThrow("Data too short to contain selector");
		});

		it("throws when function with selector not found", () => {
			const unknownSelector = new Uint8Array([0xff, 0xff, 0xff, 0xff]);
			const calldata = new Uint8Array(68);
			calldata.set(unknownSelector, 0);

			expect(() => {
				decodeData.call(testAbi, calldata);
			}).toThrow(AbiItemNotFoundError);
		});

		it("throws with hex selector in error message", () => {
			const unknownSelector = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const calldata = new Uint8Array(68);
			calldata.set(unknownSelector, 0);

			expect(() => {
				decodeData.call(testAbi, calldata);
			}).toThrow("0xdeadbeef");
		});
	});

	describe("complex parameter types", () => {
		it("decodes function with array parameter", () => {
			const abi = [
				{
					type: "function",
					name: "batchTransfer",
					stateMutability: "nonpayable",
					inputs: [
						{ type: "address[]", name: "recipients" },
						{ type: "uint256[]", name: "amounts" },
					],
					outputs: [],
				},
			];
			const recipients = [
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000002",
			];
			const amounts = [100n, 200n];
			const calldata = Function.encodeParams(abi[0], [recipients, amounts]);

			const result = decodeData.call(abi, calldata);
			expect(result.functionName).toBe("batchTransfer");
			expect(result.args).toEqual([recipients, amounts]);
		});

		it("decodes function with string parameter", () => {
			const abi = [
				{
					type: "function",
					name: "setName",
					stateMutability: "nonpayable",
					inputs: [{ type: "string", name: "name" }],
					outputs: [],
				},
			];
			const name = "Alice";
			const calldata = Function.encodeParams(abi[0], [name]);

			const result = decodeData.call(abi, calldata);
			expect(result.functionName).toBe("setName");
			expect(result.args).toEqual([name]);
		});

		it("decodes function with bytes parameter", () => {
			const abi = [
				{
					type: "function",
					name: "setData",
					stateMutability: "nonpayable",
					inputs: [{ type: "bytes", name: "data" }],
					outputs: [],
				},
			];
			const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const calldata = Function.encodeParams(abi[0], [data]);

			const result = decodeData.call(abi, calldata);
			expect(result.functionName).toBe("setData");
			expect(result.args[0]).toEqual(data);
		});
	});

	describe("boundary values", () => {
		it("decodes max uint256 amount", () => {
			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const calldata = Function.encodeParams(testAbi[0], [
				"0x0000000000000000000000000000000000000000",
				maxUint256,
			]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.args[1]).toBe(maxUint256);
		});

		it("decodes zero address", () => {
			const zeroAddr = "0x0000000000000000000000000000000000000000";
			const calldata = Function.encodeParams(testAbi[1], [zeroAddr]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.args[0]).toBe(zeroAddr);
		});

		it("decodes zero amount", () => {
			const calldata = Function.encodeParams(testAbi[0], [
				"0x0000000000000000000000000000000000000000",
				0n,
			]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.args[1]).toBe(0n);
		});
	});

	describe("this binding", () => {
		it("uses this context as abi", () => {
			const abi = [
				{
					type: "function",
					name: "test",
					stateMutability: "pure",
					inputs: [{ type: "uint256" }],
					outputs: [],
				},
			];
			const calldata = Function.encodeParams(abi[0], [42n]);

			const result = decodeData.call(abi, calldata);
			expect(result.functionName).toBe("test");
			expect(result.args).toEqual([42n]);
		});
	});

	describe("real-world scenarios", () => {
		it("decodes ERC20 transfer", () => {
			const calldata = Function.encodeParams(testAbi[0], [
				"0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
				1000000000000000000n,
			]);

			const result = decodeData.call(testAbi, calldata);
			expect(result.functionName).toBe("transfer");
			expect(result.args[0]).toBe("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
			expect(result.args[1]).toBe(1000000000000000000n);
		});

		it("handles multiple functions with similar names", () => {
			const abi = [
				{
					type: "function",
					name: "transferFrom",
					stateMutability: "nonpayable",
					inputs: [
						{ type: "address" },
						{ type: "address" },
						{ type: "uint256" },
					],
					outputs: [],
				},
				{
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [{ type: "address" }, { type: "uint256" }],
					outputs: [],
				},
			];

			const transferFromCalldata = Function.encodeParams(abi[0], [
				"0x0000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000002",
				100n,
			]);
			const transferCalldata = Function.encodeParams(abi[1], [
				"0x0000000000000000000000000000000000000001",
				100n,
			]);

			const result1 = decodeData.call(abi, transferFromCalldata);
			expect(result1.functionName).toBe("transferFrom");

			const result2 = decodeData.call(abi, transferCalldata);
			expect(result2.functionName).toBe("transfer");
		});
	});
});
