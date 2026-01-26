import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "@effect/vitest";
import { encodeError } from "./encodeError.js";

const customAbi = [
	{
		type: "error",
		name: "InsufficientBalance",
		inputs: [
			{ name: "available", type: "uint256" },
			{ name: "required", type: "uint256" },
		],
	},
	{
		type: "error",
		name: "Unauthorized",
		inputs: [{ name: "caller", type: "address" }],
	},
	{
		type: "error",
		name: "InvalidAmount",
		inputs: [],
	},
] as const;

describe("encodeError", () => {
	describe("success cases", () => {
		it.effect("encodes InsufficientBalance error", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeError(
					customAbi,
					"InsufficientBalance",
					[100n, 200n],
				);
				expect(encoded.startsWith("0x")).toBe(true);
				expect(encoded.length).toBeGreaterThan(10);
			}),
		);

		it.effect("encodes Unauthorized error with address", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeError(customAbi, "Unauthorized", [
					"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				]);
				expect(encoded.startsWith("0x")).toBe(true);
			}),
		);

		it.effect("encodes error with no inputs", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeError(customAbi, "InvalidAmount", []);
				expect(encoded.startsWith("0x")).toBe(true);
				expect(encoded.length).toBe(10);
			}),
		);

		it.effect("encodes with zero values", () =>
			Effect.gen(function* () {
				const encoded = yield* encodeError(
					customAbi,
					"InsufficientBalance",
					[0n, 0n],
				);
				expect(encoded.startsWith("0x")).toBe(true);
			}),
		);

		it.effect("encodes with max uint256", () =>
			Effect.gen(function* () {
				const maxUint256 = 2n ** 256n - 1n;
				const encoded = yield* encodeError(customAbi, "InsufficientBalance", [
					maxUint256,
					maxUint256,
				]);
				expect(encoded).toContain("f".repeat(64));
			}),
		);
	});

	describe("error cases", () => {
		it("fails for unknown error", async () => {
			const exit = await Effect.runPromiseExit(
				encodeError(customAbi, "UnknownError", []),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(
				encodeError([], "InsufficientBalance", [100n, 200n]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong argument types", async () => {
			const exit = await Effect.runPromiseExit(
				encodeError(customAbi, "InsufficientBalance", [
					"not a number",
					"also not",
				]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});
