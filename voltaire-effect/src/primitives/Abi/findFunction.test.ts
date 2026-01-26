import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import { findFunction } from "./findFunction.js";

const erc20Abi = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

describe("findFunction", () => {
	describe("success cases", () => {
		it.effect("finds transfer function", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction(erc20Abi, "transfer");
				expect(fn).not.toBeUndefined();
				expect(fn?.name).toBe("transfer");
				expect(fn?.inputs.length).toBe(2);
			}),
		);

		it.effect("finds balanceOf function", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction(erc20Abi, "balanceOf");
				expect(fn).not.toBeUndefined();
				expect(fn?.name).toBe("balanceOf");
				expect(fn?.stateMutability).toBe("view");
			}),
		);

		it.effect("returns undefined for unknown function", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction(erc20Abi, "unknownFunction");
				expect(fn).toBeUndefined();
			}),
		);

		it.effect("returns undefined for event name", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction(erc20Abi, "Transfer");
				expect(fn).toBeUndefined();
			}),
		);

		it.effect("returns undefined with empty ABI", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction([], "transfer");
				expect(fn).toBeUndefined();
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const fn = yield* findFunction(erc20Abi, "nonexistent");
				expect(fn).toBeUndefined();
			}),
		);
	});
});
