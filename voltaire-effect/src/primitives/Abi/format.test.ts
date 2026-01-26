import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { format } from "./format.js";

describe("format", () => {
	describe("function formatting", () => {
		it.effect("formats transfer function", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function" as const,
					name: "transfer",
					inputs: [
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				};
				const formatted = yield* format(fn);
				expect(formatted).toContain("transfer");
				expect(formatted).toContain("address");
				expect(formatted).toContain("uint256");
			}),
		);

		it.effect("formats function with no inputs", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function" as const,
					name: "totalSupply",
					inputs: [],
					outputs: [{ type: "uint256" }],
				};
				const formatted = yield* format(fn);
				expect(formatted).toContain("totalSupply");
			}),
		);

		it.effect("formats function with multiple outputs", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function" as const,
					name: "getReserves",
					inputs: [],
					outputs: [
						{ name: "reserve0", type: "uint112" },
						{ name: "reserve1", type: "uint112" },
						{ name: "blockTimestampLast", type: "uint32" },
					],
				};
				const formatted = yield* format(fn);
				expect(formatted).toContain("getReserves");
			}),
		);
	});

	describe("event formatting", () => {
		it.effect("formats Transfer event", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event" as const,
					name: "Transfer",
					inputs: [
						{ name: "from", type: "address", indexed: true },
						{ name: "to", type: "address", indexed: true },
						{ name: "value", type: "uint256", indexed: false },
					],
				};
				const formatted = yield* format(evt);
				expect(formatted).toContain("Transfer");
				expect(formatted).toContain("address");
			}),
		);
	});

	describe("error formatting", () => {
		it.effect("formats error", () =>
			Effect.gen(function* () {
				const err = {
					type: "error" as const,
					name: "InsufficientBalance",
					inputs: [
						{ name: "available", type: "uint256" },
						{ name: "required", type: "uint256" },
					],
				};
				const formatted = yield* format(err);
				expect(formatted).toContain("InsufficientBalance");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const fn = {
					type: "function" as const,
					name: "test",
					inputs: [],
					outputs: [],
				};
				const formatted = yield* format(fn);
				expect(formatted).toContain("test");
			}),
		);
	});
});
