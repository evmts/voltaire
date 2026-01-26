import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import { getEventSignature } from "./getEventSignature.js";
import type { Event } from "@tevm/voltaire/Abi";

describe("getEventSignature", () => {
	describe("success cases", () => {
		it.effect("gets Transfer event signature", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event",
					name: "Transfer",
					inputs: [
						{ name: "from", type: "address", indexed: true },
						{ name: "to", type: "address", indexed: true },
						{ name: "value", type: "uint256", indexed: false },
					],
				} as Event.EventType;
				const sig = yield* getEventSignature(evt);
				expect(sig).toBe("Transfer(address,address,uint256)");
			}),
		);

		it.effect("gets Approval event signature", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event",
					name: "Approval",
					inputs: [
						{ name: "owner", type: "address", indexed: true },
						{ name: "spender", type: "address", indexed: true },
						{ name: "value", type: "uint256", indexed: false },
					],
				} as Event.EventType;
				const sig = yield* getEventSignature(evt);
				expect(sig).toBe("Approval(address,address,uint256)");
			}),
		);

		it.effect("gets event with no inputs", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event",
					name: "Paused",
					inputs: [],
				} as Event.EventType;
				const sig = yield* getEventSignature(evt);
				expect(sig).toBe("Paused()");
			}),
		);

		it.effect("gets event with single input", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event",
					name: "OwnershipTransferred",
					inputs: [{ name: "newOwner", type: "address", indexed: true }],
				} as Event.EventType;
				const sig = yield* getEventSignature(evt);
				expect(sig).toBe("OwnershipTransferred(address)");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const evt = {
					type: "event",
					name: "Test",
					inputs: [],
				} as Event.EventType;
				const sig = yield* getEventSignature(evt);
				expect(sig).toBe("Test()");
			}),
		);
	});
});
