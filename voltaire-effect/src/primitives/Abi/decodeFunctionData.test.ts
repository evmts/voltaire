import { describe, expect, it } from "@effect/vitest";
import { Hex } from "@tevm/voltaire";
import { Abi } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { decodeFunctionData } from "./decodeFunctionData.js";
import { encodeFunctionData } from "./encodeFunctionData.js";

const erc20Abi = Abi([
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		type: "function",
		name: "balanceOf",
		stateMutability: "view",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
]);

describe("decodeFunctionData", () => {
	describe("encode/decode round-trips", () => {
		it.effect("round-trips transfer correctly", () =>
			Effect.gen(function* () {
				const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3";
				const amount = 1000000000000000000n;
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					to,
					amount,
				]);
				const decoded = yield* decodeFunctionData(erc20Abi, calldata);
				expect(decoded.name).toBe("transfer");
				expect(decoded.params.length).toBe(2);
				expect((decoded.params[0] as string).toLowerCase()).toBe(
					to.toLowerCase(),
				);
				expect(decoded.params[1]).toBe(amount);
			}),
		);

		it.effect("round-trips balanceOf correctly", () =>
			Effect.gen(function* () {
				const account = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3";
				const calldata = yield* encodeFunctionData(erc20Abi, "balanceOf", [
					account,
				]);
				const decoded = yield* decodeFunctionData(erc20Abi, calldata);
				expect(decoded.name).toBe("balanceOf");
				expect(decoded.params.length).toBe(1);
				expect((decoded.params[0] as string).toLowerCase()).toBe(
					account.toLowerCase(),
				);
			}),
		);

		it.effect("round-trips approve correctly", () =>
			Effect.gen(function* () {
				const spender = "0x1234567890123456789012345678901234567890";
				const amount = 5000n;
				const calldata = yield* encodeFunctionData(erc20Abi, "approve", [
					spender,
					amount,
				]);
				const decoded = yield* decodeFunctionData(erc20Abi, calldata);
				expect(decoded.name).toBe("approve");
				expect(decoded.params.length).toBe(2);
				expect((decoded.params[0] as string).toLowerCase()).toBe(
					spender.toLowerCase(),
				);
				expect(decoded.params[1]).toBe(amount);
			}),
		);

		it.effect("round-trips with zero amount", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					0n,
				]);
				const decoded = yield* decodeFunctionData(erc20Abi, calldata);
				expect(decoded.params[1]).toBe(0n);
			}),
		);

		it.effect("round-trips with max uint256", () =>
			Effect.gen(function* () {
				const maxUint256 = 2n ** 256n - 1n;
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					maxUint256,
				]);
				const decoded = yield* decodeFunctionData(erc20Abi, calldata);
				expect(decoded.params[1]).toBe(maxUint256);
			}),
		);
	});

	describe("error cases", () => {
		it("fails on invalid selector", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionData(erc20Abi, Hex("0xdeadbeef")),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on calldata too short", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionData(erc20Abi, Hex("0x12")),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on empty calldata", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionData(erc20Abi, Hex("0x")),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on just selector without args for function needing args", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionData(erc20Abi, Hex("0xa9059cbb")),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunctionData(
					Abi([]),
					Hex(
						"0xa9059cbb0000000000000000000000000000000000000000000000000000000000000000",
					),
				),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
