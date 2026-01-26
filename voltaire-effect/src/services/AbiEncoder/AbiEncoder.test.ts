/**
 * @fileoverview Tests for AbiEncoder service.
 */

import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	AbiDecodeError,
	AbiEncodeError,
	AbiEncoderService,
} from "./AbiEncoderService.js";
import { DefaultAbiEncoder } from "./DefaultAbiEncoder.js";

const ERC20_ABI = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
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

describe("AbiEncoderService", () => {
	describe("encodeFunction", () => {
		it.skip("returns hex starting with selector (requires encodeFunction export)", () => {
			// Test skipped: BrandedAbi.encodeFunction is not exported from @tevm/voltaire
		});

		it.effect("fails with AbiEncodeError for unknown function", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const result = yield* encoder
					.encodeFunction(ERC20_ABI, "unknownFunction", [])
					.pipe(Effect.either);

				expect(result._tag).toBe("Left");
				if (result._tag === "Left") {
					expect(result.left).toBeInstanceOf(AbiEncodeError);
					expect(result.left._tag).toBe("AbiEncodeError");
					expect(result.left.functionName).toBe("unknownFunction");
				}
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);
	});

	describe("decodeFunction", () => {
		it.effect("decodes function result successfully", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const encodedResult =
					"0x0000000000000000000000000000000000000000000000000000000000000001";
				const result = yield* encoder.decodeFunction(
					ERC20_ABI,
					"transfer",
					encodedResult,
				);

				expect(result).toEqual([true]);
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);

		it.effect("fails with AbiDecodeError for invalid hex", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const result = yield* encoder
					.decodeFunction(ERC20_ABI, "transfer", "0xinvalid")
					.pipe(Effect.either);

				expect(result._tag).toBe("Left");
				if (result._tag === "Left") {
					expect(result.left).toBeInstanceOf(AbiDecodeError);
					expect(result.left._tag).toBe("AbiDecodeError");
					expect(result.left.data).toBe("0xinvalid");
				}
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);
	});

	describe("encodeEventTopics", () => {
		it.effect("returns event selector as first topic", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const result = yield* encoder.encodeEventTopics(
					ERC20_ABI,
					"Transfer",
				);

				expect(result.length).toBeGreaterThanOrEqual(1);
				expect(result[0]).toMatch(/^0x[a-fA-F0-9]{64}$/);
				expect(result[0]).toBe(
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				);
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);

		it.effect("handles indexed args correctly", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const fromAddress = "0x1111111111111111111111111111111111111111";
				const toAddress = "0x2222222222222222222222222222222222222222";
				const result = yield* encoder.encodeEventTopics(
					ERC20_ABI,
					"Transfer",
					[fromAddress, toAddress],
				);

				expect(result.length).toBe(3);
				expect(result[0]).toBe(
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				);
				expect(result[1]).toMatch(/^0x[a-fA-F0-9]{64}$/);
				expect(result[2]).toMatch(/^0x[a-fA-F0-9]{64}$/);
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);

		it.effect("works without args (just selector)", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const result = yield* encoder.encodeEventTopics(
					ERC20_ABI,
					"Transfer",
					[],
				);

				expect(result.length).toBe(1);
				expect(result[0]).toBe(
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
				);
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);
	});

	describe("decodeEventLog", () => {
		it.effect("decodes event log successfully", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const topics = [
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
					"0x0000000000000000000000001111111111111111111111111111111111111111",
					"0x0000000000000000000000002222222222222222222222222222222222222222",
				] as const;
				const data =
					"0x00000000000000000000000000000000000000000000000000000000000003e8";

				const result = yield* encoder.decodeEventLog(
					ERC20_ABI,
					"Transfer",
					data,
					topics,
				);

				expect(result).toBeDefined();
				expect(typeof result).toBe("object");
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);

		it.effect("fails with AbiDecodeError for missing event", () =>
			Effect.gen(function* () {
				const encoder = yield* AbiEncoderService;
				const result = yield* encoder
					.decodeEventLog(ERC20_ABI, "NonExistentEvent", "0x", [])
					.pipe(Effect.either);

				expect(result._tag).toBe("Left");
				if (result._tag === "Left") {
					expect(result.left).toBeInstanceOf(AbiDecodeError);
					expect(result.left._tag).toBe("AbiDecodeError");
				}
			}).pipe(Effect.provide(DefaultAbiEncoder)),
		);
	});
});
