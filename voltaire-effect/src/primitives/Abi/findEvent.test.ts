import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { findEvent } from "./findEvent.js";

const erc20Abi = [
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
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
	{
		type: "event",
		name: "Approval",
		inputs: [
			{ name: "owner", type: "address", indexed: true },
			{ name: "spender", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

describe("findEvent", () => {
	describe("success cases", () => {
		it.effect("finds Transfer event", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "Transfer");
				expect(evt).not.toBeUndefined();
				expect(evt?.name).toBe("Transfer");
				expect(evt?.inputs.length).toBe(3);
			}),
		);

		it.effect("finds Approval event", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "Approval");
				expect(evt).not.toBeUndefined();
				expect(evt?.name).toBe("Approval");
			}),
		);

		it.effect("returns undefined for unknown event", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "UnknownEvent");
				expect(evt).toBeUndefined();
			}),
		);

		it.effect("returns undefined for function name", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "transfer");
				expect(evt).toBeUndefined();
			}),
		);

		it.effect("returns undefined with empty ABI", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent([], "Transfer");
				expect(evt).toBeUndefined();
			}),
		);
	});

	describe("indexed inputs", () => {
		it.effect("returns inputs with indexed flag", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "Transfer");
				expect(evt).not.toBeUndefined();
				if (evt) {
					const indexed = evt.inputs.filter((i) => i.indexed);
					expect(indexed.length).toBe(2);
				}
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const evt = yield* findEvent(erc20Abi, "nonexistent");
				expect(evt).toBeUndefined();
			}),
		);
	});
});
