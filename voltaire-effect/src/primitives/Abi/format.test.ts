import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { ErrorSchema, EventSchema, FunctionSchema } from "./AbiSchema.js";
import { format } from "./format.js";

describe("format", () => {
	describe("function formatting", () => {
		it.effect("formats transfer function", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "transfer",
					stateMutability: "nonpayable",
					inputs: [
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
					outputs: [{ type: "bool" }],
				});
				const formatted = yield* format(fn as any);
				expect(formatted).toContain("transfer");
				expect(formatted).toContain("address");
				expect(formatted).toContain("uint256");
			}),
		);

		it.effect("formats function with no inputs", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "totalSupply",
					stateMutability: "view",
					inputs: [],
					outputs: [{ type: "uint256" }],
				});
				const formatted = yield* format(fn as any);
				expect(formatted).toContain("totalSupply");
			}),
		);

		it.effect("formats function with multiple outputs", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "getReserves",
					stateMutability: "view",
					inputs: [],
					outputs: [
						{ name: "reserve0", type: "uint112" },
						{ name: "reserve1", type: "uint112" },
						{ name: "blockTimestampLast", type: "uint32" },
					],
				});
				const formatted = yield* format(fn as any);
				expect(formatted).toContain("getReserves");
			}),
		);
	});

	describe("event formatting", () => {
		it.effect("formats Transfer event", () =>
			Effect.gen(function* () {
				const evt = S.decodeUnknownSync(EventSchema)({
					type: "event",
					name: "Transfer",
					inputs: [
						{ name: "from", type: "address", indexed: true },
						{ name: "to", type: "address", indexed: true },
						{ name: "value", type: "uint256", indexed: false },
					],
				});
				const formatted = yield* format(evt as any);
				expect(formatted).toContain("Transfer");
				expect(formatted).toContain("address");
			}),
		);
	});

	describe("error formatting", () => {
		it.effect("formats error", () =>
			Effect.gen(function* () {
				const err = S.decodeUnknownSync(ErrorSchema)({
					type: "error",
					name: "InsufficientBalance",
					inputs: [
						{ name: "available", type: "uint256" },
						{ name: "required", type: "uint256" },
					],
				});
				const formatted = yield* format(err as any);
				expect(formatted).toContain("InsufficientBalance");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const fn = S.decodeUnknownSync(FunctionSchema)({
					type: "function",
					name: "test",
					stateMutability: "nonpayable",
					inputs: [],
					outputs: [],
				});
				const formatted = yield* format(fn as any);
				expect(formatted).toContain("test");
			}),
		);
	});
});
