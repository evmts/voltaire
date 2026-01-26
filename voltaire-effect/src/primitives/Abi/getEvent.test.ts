import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { getEvent } from "./getEvent.js";

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

describe("getEvent", () => {
	describe("success cases", () => {
		it.effect("gets Transfer event", () =>
			Effect.gen(function* () {
				const evt = yield* getEvent(erc20Abi, "Transfer");
				expect(evt.name).toBe("Transfer");
				expect(evt.type).toBe("event");
				expect(evt.inputs.length).toBe(3);
			}),
		);

		it.effect("gets Approval event", () =>
			Effect.gen(function* () {
				const evt = yield* getEvent(erc20Abi, "Approval");
				expect(evt.name).toBe("Approval");
				expect(evt.inputs.length).toBe(3);
			}),
		);

		it.effect("gets event with indexed inputs", () =>
			Effect.gen(function* () {
				const evt = yield* getEvent(erc20Abi, "Transfer");
				const indexed = evt.inputs.filter((i) => i.indexed);
				expect(indexed.length).toBe(2);
			}),
		);
	});

	describe("error cases", () => {
		it("fails for unknown event", async () => {
			const exit = await Effect.runPromiseExit(
				getEvent(erc20Abi, "UnknownEvent"),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails for function name (not an event)", async () => {
			const exit = await Effect.runPromiseExit(getEvent(erc20Abi, "transfer"));
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty ABI", async () => {
			const exit = await Effect.runPromiseExit(getEvent([], "Transfer"));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("error handling", () => {
		it.effect("can catch error with Effect.catchAll", () =>
			Effect.gen(function* () {
				const result = yield* getEvent(erc20Abi, "unknown").pipe(
					Effect.catchAll(() =>
						Effect.succeed({ name: "fallback", type: "event" as const }),
					),
				);
				expect(result.name).toBe("fallback");
			}),
		);
	});
});
