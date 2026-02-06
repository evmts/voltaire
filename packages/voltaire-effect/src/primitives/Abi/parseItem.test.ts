import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { AbiItemParseError, parseItem } from "./parseItem.js";

describe("parseItem", () => {
	describe("success cases", () => {
		it.effect("parses function item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "function",
					name: "transfer",
					inputs: [
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("function");
				if (item.type === "function") {
					expect(item.name).toBe("transfer");
				}
			}),
		);

		it.effect("parses event item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "event",
					name: "Transfer",
					inputs: [
						{ name: "from", type: "address", indexed: true },
						{ name: "to", type: "address", indexed: true },
						{ name: "value", type: "uint256", indexed: false },
					],
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("event");
				if (item.type === "event") {
					expect(item.name).toBe("Transfer");
				}
			}),
		);

		it.effect("parses error item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "error",
					name: "InsufficientBalance",
					inputs: [{ name: "available", type: "uint256" }],
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("error");
				if (item.type === "error") {
					expect(item.name).toBe("InsufficientBalance");
				}
			}),
		);

		it.effect("parses constructor item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "constructor",
					inputs: [{ name: "initialSupply", type: "uint256" }],
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("constructor");
			}),
		);

		it.effect("parses fallback item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "fallback",
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("fallback");
			}),
		);

		it.effect("parses receive item", () =>
			Effect.gen(function* () {
				const jsonString = JSON.stringify({
					type: "receive",
				});
				const item = yield* parseItem(jsonString);
				expect(item.type).toBe("receive");
			}),
		);
	});

	describe("error cases", () => {
		it("fails on invalid JSON", async () => {
			const exit = await Effect.runPromiseExit(parseItem("not valid json"));
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on array", async () => {
			const exit = await Effect.runPromiseExit(parseItem("[]"));
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on null", async () => {
			const exit = await Effect.runPromiseExit(parseItem("null"));
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on missing type", async () => {
			const exit = await Effect.runPromiseExit(
				parseItem(JSON.stringify({ name: "test" })),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on invalid type", async () => {
			const exit = await Effect.runPromiseExit(
				parseItem(JSON.stringify({ type: "invalid" })),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails on number type", async () => {
			const exit = await Effect.runPromiseExit(
				parseItem(JSON.stringify({ type: 123 })),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("AbiItemParseError", () => {
		it("has correct _tag", () => {
			const error = new AbiItemParseError({ message: "test error" });
			expect(error._tag).toBe("AbiItemParseError");
			expect(error.name).toBe("AbiItemParseError");
		});

		it("preserves cause", () => {
			const cause = new Error("original error");
			const error = new AbiItemParseError({ message: "wrapped error", cause });
			expect(error.cause).toBe(cause);
		});
	});
});
