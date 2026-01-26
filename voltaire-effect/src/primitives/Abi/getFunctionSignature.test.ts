import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { FunctionSchema } from "./AbiSchema.js";
import { getFunctionSignature } from "./getFunctionSignature.js";

describe("getFunctionSignature", () => {
	describe("success cases", () => {
		it.effect("gets transfer signature", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				});
				const sig = yield* getFunctionSignature(fn as any);
				expect(sig).toBe("transfer(address,uint256)");
			}),
		);

		it.effect("gets balanceOf signature", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "balanceOf",
					stateMutability: "view",
					inputs: [{ name: "account", type: "address" }],
					outputs: [{ type: "uint256" }],
				});
				const sig = yield* getFunctionSignature(fn as any);
				expect(sig).toBe("balanceOf(address)");
			}),
		);

		it.effect("gets function with no inputs", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "totalSupply",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "uint256" }],
				});
				const sig = yield* getFunctionSignature(fn as any);
				expect(sig).toBe("totalSupply()");
			}),
		);

		it.effect("gets transferFrom signature", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "transferFrom",
					stateMutability: "nonpayable",
					inputs: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				});
				const sig = yield* getFunctionSignature(fn as any);
				expect(sig).toBe("transferFrom(address,address,uint256)");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "test",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [],
				});
				const sig = yield* getFunctionSignature(fn as any);
				expect(sig).toBe("test()");
			}),
		);
	});
});
