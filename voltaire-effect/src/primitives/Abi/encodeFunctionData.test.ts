import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as S from "effect/Schema";
import { fromArray } from "./AbiSchema.js";
import { encodeFunctionData } from "./encodeFunctionData.js";

const erc20Abi = S.decodeUnknownSync(fromArray)([
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
	{
		type: "function",
		name: "transferFrom",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
]);

describe("encodeFunctionData", () => {
	describe("success cases", () => {
		it.effect("encodes transfer function correctly", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					1000000000000000000n,
				]);
				expect(calldata.startsWith("0xa9059cbb")).toBe(true);
				expect(calldata.length).toBe(138);
			}),
		);

		it.effect("encodes balanceOf function correctly", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "balanceOf", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				]);
				expect(calldata.startsWith("0x70a08231")).toBe(true);
				expect(calldata.length).toBe(74);
			}),
		);

		it.effect("encodes approve function correctly", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "approve", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					1000n,
				]);
				expect(calldata.startsWith("0x095ea7b3")).toBe(true);
			}),
		);

		it.effect("encodes transferFrom with three args", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "transferFrom", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					"0x1234567890123456789012345678901234567890",
					500n,
				]);
				expect(calldata.startsWith("0x23b872dd")).toBe(true);
			}),
		);

		it.effect("encodes with zero amount", () =>
			Effect.gen(function* () {
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					0n,
				]);
				expect(calldata).toContain("0".repeat(64));
			}),
		);

		it.effect("encodes with max uint256", () =>
			Effect.gen(function* () {
				const maxUint256 = 2n ** 256n - 1n;
				const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
					maxUint256,
				]);
				expect(calldata).toContain("f".repeat(64));
			}),
		);
	});

	describe("error cases", () => {
		it("fails with AbiItemNotFoundError for unknown function", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionData(erc20Abi, "unknownFunction", []),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with AbiEncodingError for wrong argument types", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionData(erc20Abi, "transfer", [
					"not an address",
					"not a uint",
				]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails when too few arguments", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionData(erc20Abi, "transfer", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				encodeFunctionData([], "transfer", ["0x123", 100n]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
