import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "@effect/vitest";
import { decodeFunctionResult } from "./decodeFunctionResult.js";
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
	{
		type: "function",
		name: "name",
		inputs: [],
		outputs: [{ type: "string" }],
	},
] as const;

describe("decodeFunctionResult", () => {
	describe("encode/decode round-trips", () => {
		it.effect("round-trips balanceOf result", () =>
			Effect.gen(function* () {
				const balance = 1000000000000000000n;
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					balance,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"balanceOf",
					encoded,
				);
				expect(decoded[0]).toBe(balance);
			}),
		);

		it.effect("round-trips transfer bool result (true)", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "transfer", [
					true,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"transfer",
					encoded,
				);
				expect(decoded[0]).toBe(true);
			}),
		);

		it.effect("round-trips transfer bool result (false)", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "transfer", [
					false,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"transfer",
					encoded,
				);
				expect(decoded[0]).toBe(false);
			}),
		);

		it.effect("round-trips decimals uint8 result", () =>
			Effect.gen(function* () {
				const decimals = 18n;
				const encoded = yield* encodeFunctionResult(erc20Abi, "decimals", [
					decimals,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"decimals",
					encoded,
				);
				expect(decoded[0]).toBe(decimals);
			}),
		);

		it.effect("decodes zero balance", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					0n,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"balanceOf",
					encoded,
				);
				expect(decoded[0]).toBe(0n);
			}),
		);

		it.effect("decodes max uint256", () =>
			Effect.gen(function* () {
				const maxUint256 = 2n ** 256n - 1n;
				const encoded = yield* encodeFunctionResult(erc20Abi, "balanceOf", [
					maxUint256,
				]);
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"balanceOf",
					encoded,
				);
				expect(decoded[0]).toBe(maxUint256);
			}),
		);
	});

	describe("raw hex decoding", () => {
		it.effect("decodes known uint256 hex", () =>
			Effect.gen(function* () {
				const data =
					"0x0000000000000000000000000000000000000000000000000de0b6b3a7640000" as `0x${string}`;
				const decoded = yield* decodeFunctionResult(
					erc20Abi,
					"balanceOf",
					data,
				);
				expect(decoded[0]).toBe(1000000000000000000n);
			}),
		);

		it.effect("decodes true bool hex", () =>
			Effect.gen(function* () {
				const data =
					"0x0000000000000000000000000000000000000000000000000000000000000001" as `0x${string}`;
				const decoded = yield* decodeFunctionResult(erc20Abi, "transfer", data);
				expect(decoded[0]).toBe(true);
			}),
		);

		it.effect("decodes false bool hex", () =>
			Effect.gen(function* () {
				const data =
					"0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
				const decoded = yield* decodeFunctionResult(erc20Abi, "transfer", data);
				expect(decoded[0]).toBe(false);
			}),
		);
	});

	describe("error cases", () => {
		it("fails for unknown function", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionResult(
					erc20Abi,
					"unknownFunction",
					"0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
				),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionResult(
					[],
					"balanceOf",
					"0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
				),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
