import { describe, expect, it } from "@effect/vitest";
import type { Error as AbiError } from "@tevm/voltaire/Abi";
import * as Effect from "effect/Effect";
import { getErrorSignature } from "./getErrorSignature.js";

describe("getErrorSignature", () => {
	describe("success cases", () => {
		it.effect("gets InsufficientBalance error signature", () =>
			Effect.gen(function* () {
				const err = {
					type: "error",
					name: "InsufficientBalance",
					inputs: [
						{ name: "available", type: "uint256" },
						{ name: "required", type: "uint256" },
					],
				} as AbiError.ErrorType;
				const sig = yield* getErrorSignature(err);
				expect(sig).toBe("InsufficientBalance(uint256,uint256)");
			}),
		);

		it.effect("gets Unauthorized error signature", () =>
			Effect.gen(function* () {
				const err = {
					type: "error",
					name: "Unauthorized",
					inputs: [{ name: "caller", type: "address" }],
				} as AbiError.ErrorType;
				const sig = yield* getErrorSignature(err);
				expect(sig).toBe("Unauthorized(address)");
			}),
		);

		it.effect("gets error with no inputs", () =>
			Effect.gen(function* () {
				const err = {
					type: "error",
					name: "InvalidAmount",
					inputs: [],
				} as AbiError.ErrorType;
				const sig = yield* getErrorSignature(err);
				expect(sig).toBe("InvalidAmount()");
			}),
		);

		it.effect("gets error with multiple complex types", () =>
			Effect.gen(function* () {
				const err = {
					type: "error",
					name: "TransferFailed",
					inputs: [
						{ name: "from", type: "address" },
						{ name: "to", type: "address" },
						{ name: "amount", type: "uint256" },
					],
				} as AbiError.ErrorType;
				const sig = yield* getErrorSignature(err);
				expect(sig).toBe("TransferFailed(address,address,uint256)");
			}),
		);
	});

	describe("is infallible", () => {
		it.effect("never fails", () =>
			Effect.gen(function* () {
				const err = {
					type: "error",
					name: "Test",
					inputs: [],
				} as AbiError.ErrorType;
				const sig = yield* getErrorSignature(err);
				expect(sig).toBe("Test()");
			}),
		);
	});
});
