import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { decodeFunction } from "./decodeFunction.js";
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

describe("decodeFunction", () => {
	describe("encode/decode round-trips", () => {
		it.effect("round-trips transfer", () =>
			Effect.gen(function* () {
				const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3";
				const amount = 1000000000000000000n;
				const calldata = yield* encodeFunction(erc20Abi, "transfer", [
					to,
					amount,
				]);
				const decoded = yield* decodeFunction(erc20Abi, calldata);
				expect(decoded.name).toBe("transfer");
				expect((decoded.params[0] as string).toLowerCase()).toBe(
					to.toLowerCase(),
				);
				expect(decoded.params[1]).toBe(amount);
			}),
		);

		it.effect("round-trips balanceOf", () =>
			Effect.gen(function* () {
				const account = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3";
				const calldata = yield* encodeFunction(erc20Abi, "balanceOf", [
					account,
				]);
				const decoded = yield* decodeFunction(erc20Abi, calldata);
				expect(decoded.name).toBe("balanceOf");
				expect((decoded.params[0] as string).toLowerCase()).toBe(
					account.toLowerCase(),
				);
			}),
		);
	});

	describe("error cases", () => {
		it("fails on invalid selector", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunction(erc20Abi, "0xdeadbeef" as `0x${string}`),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on too short calldata", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunction(erc20Abi, "0x12" as `0x${string}`),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				decodeFunction(
					[],
					"0xa9059cbb0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
				),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
