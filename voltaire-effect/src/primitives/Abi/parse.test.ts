import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "@effect/vitest";
import { parse, AbiParseError } from "./parse.js";

describe("parse", () => {
	describe("success cases", () => {
		it.effect("parses valid JSON ABI string", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify([
					{
						type: "function",
						name: "transfer",
						inputs: [
							{ name: "to", type: "address" },
							{ name: "amount", type: "uint256" },
						],
						outputs: [{ type: "bool" }],
					},
				]);
				const abi = yield* parse(jsonString);
				expect(Array.isArray(abi)).toBe(true);
				expect(abi.length).toBe(1);
			}),
		);

		it.effect("parses empty array as valid ABI", () =>
			Effect.gen(function* () {
				const abi = yield* parse("[]");
				expect(Array.isArray(abi)).toBe(true);
				expect(abi.length).toBe(0);
			}),
		);

		it.effect("parses ABI with multiple items", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify([
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
						type: "event",
						name: "Transfer",
						inputs: [
							{ name: "from", type: "address", indexed: true },
							{ name: "to", type: "address", indexed: true },
							{ name: "value", type: "uint256", indexed: false },
						],
					},
				]);
				const abi = yield* parse(jsonString);
				expect(abi.length).toBe(2);
			}),
		);

		it.effect("parses ABI with error definitions", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify([
					{
						type: "error",
						name: "InsufficientBalance",
						inputs: [{ name: "available", type: "uint256" }],
					},
				]);
				const abi = yield* parse(jsonString);
				expect(abi.length).toBe(1);
			}),
		);
	});

	describe("error cases", () => {
		it("fails with AbiParseError on invalid JSON", async () => {
			const exit = await Effect.runPromiseExit(parse("not valid json {{{"));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("AbiParseError", () => {
		it("has correct _tag", () => {
			const error = new AbiParseError("test error");
			expect(error._tag).toBe("AbiParseError");
			expect(error.name).toBe("AbiParseError");
		});

		it("preserves cause", () => {
			const cause = new Error("original error");
			const error = new AbiParseError("wrapped error", { cause });
			expect(error.cause).toBe(cause);
		});
	});
});
