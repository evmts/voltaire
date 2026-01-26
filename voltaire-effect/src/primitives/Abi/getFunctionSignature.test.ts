import { describe, expect, it } from "@effect/vitest";
import type { Function as AbiFunction } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";
import { getFunctionSignature } from "./getFunctionSignature.js";

describe("getFunctionSignature", () => {
	describe("success cases", () => {
		it.effect("gets transfer signature", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				} as AbiFunction.FunctionType;
				const sig = yield* getFunctionSignature(fn);
				expect(sig).toBe("transfer(address,uint256)");
			}),
		);

		it.effect("gets balanceOf signature", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function",
					name: "balanceOf",
					stateMutability: "view",
					inputs: [{ name: "account", type: "address" }],
					outputs: [{ type: "uint256" }],
				} as AbiFunction.FunctionType;
				const sig = yield* getFunctionSignature(fn);
				expect(sig).toBe("balanceOf(address)");
			}),
		);

		it.effect("gets function with no inputs", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function",
					name: "totalSupply",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "uint256" }],
				} as AbiFunction.FunctionType;
				const sig = yield* getFunctionSignature(fn);
				expect(sig).toBe("totalSupply()");
			}),
		);

		it.effect("gets transferFrom signature", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function",
					name: "transferFrom",
					stateMutability: "nonpayable",
					inputs: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				} as AbiFunction.FunctionType;
				const sig = yield* getFunctionSignature(fn);
				expect(sig).toBe("transferFrom(address,address,uint256)");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function",
					name: "test",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [],
				} as AbiFunction.FunctionType;
				const sig = yield* getFunctionSignature(fn);
				expect(sig).toBe("test()");
			}),
		);
	});
});
