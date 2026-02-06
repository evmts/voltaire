import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { DefaultFormatter } from "./DefaultFormatter.js";
import { FormatterService } from "./FormatterService.js";

describe("DefaultFormatter", () => {
	describe("formatBlock", () => {
		it.effect("returns input unchanged", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { number: "0x1", hash: "0xabc", transactions: [] };
				const result = yield* formatter.formatBlock(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);

		it.effect("preserves object identity", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { nested: { deep: { value: 42 } } };
				const result = yield* formatter.formatBlock(input);
				expect(result).toBe(input);
				expect(result).toStrictEqual(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);
	});

	describe("formatTransaction", () => {
		it.effect("returns input unchanged", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = {
					hash: "0x123",
					from: "0xabc",
					to: "0xdef",
					value: "0x0",
				};
				const result = yield* formatter.formatTransaction(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);

		it.effect("preserves object identity", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { data: new Uint8Array([1, 2, 3]) };
				const result = yield* formatter.formatTransaction(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);
	});

	describe("formatReceipt", () => {
		it.effect("returns input unchanged", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { status: "0x1", gasUsed: "0x5208", logs: [] };
				const result = yield* formatter.formatReceipt(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);

		it.effect("preserves object identity", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { logs: [{ topics: ["0x1"] }] };
				const result = yield* formatter.formatReceipt(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);
	});

	describe("formatRequest", () => {
		it.effect("returns input unchanged", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { to: "0x123", data: "0x", value: "0x0" };
				const result = yield* formatter.formatRequest(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);

		it.effect("preserves object identity", () =>
			Effect.gen(function* () {
				const formatter = yield* FormatterService;
				const input = { gasLimit: 21000n };
				const result = yield* formatter.formatRequest(input);
				expect(result).toBe(input);
			}).pipe(Effect.provide(DefaultFormatter)),
		);
	});
});
