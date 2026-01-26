import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { encodeFunctionResult } from "./encodeFunctionResult.js";

const erc20Abi = [
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
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
		name: "decimals",
		inputs: [],
		outputs: [{ type: "uint8" }],
	},
] as const;

describe("encodeFunctionResult", () => {
	describe("success cases", () => {
		it.effect("encodes uint256 result", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					1000000000000000000n,
				]);
				expect(encoded.startsWith("0x")).toBe(true);
				expect(encoded.length).toBe(66);
			}),
		);

		it.effect("encodes bool true result", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "transfer", [
					true,
				]);
				expect(encoded).toBe(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				);
			}),
		);

		it.effect("encodes bool false result", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "transfer", [
					false,
				]);
				expect(encoded).toBe(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				);
			}),
		);

		it.effect("encodes uint8 result", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "decimals", [18]);
				expect(encoded.startsWith("0x")).toBe(true);
				expect(encoded).toContain("12");
			}),
		);

		it.effect("encodes zero value", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					0n,
				]);
				expect(encoded).toBe(
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				);
			}),
		);

		it.effect("encodes max uint256", () =>
			Effect.gen(function* () {
				const maxUint256 = 2n ** 256n - 1n;
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					maxUint256,
				]);
				expect(encoded).toBe(`0x${"f".repeat(64)}`);
			}),
		);
	});

	describe("error cases", () => {
		it("fails for unknown function", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionResult(erc20Abi, "unknownFunction", [100n]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionResult([], "balanceOf", [100n]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
