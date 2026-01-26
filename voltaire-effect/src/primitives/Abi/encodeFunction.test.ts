import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { encodeFunction } from "./encodeFunction.js";

const erc20Abi = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
] as const;

describe("encodeFunction", () => {
	describe("success cases", () => {
		it.effect("encodes transfer function", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunction(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					1000000000000000000n,
				]);
				expect(calldata.startsWith("0xa9059cbb")).toBe(true);
			}),
		);

		it.effect("encodes balanceOf function", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunction(erc20Abi, "balanceOf", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				]);
				expect(calldata.startsWith("0x70a08231")).toBe(true);
			}),
		);
	});

	describe("error cases", () => {
		it("fails for unknown function", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunction(erc20Abi, "unknownFunction", []),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunction([], "transfer", ["0x123", 100n]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
