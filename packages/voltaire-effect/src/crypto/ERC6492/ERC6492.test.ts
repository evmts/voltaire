import { describe, expect, it } from "@effect/vitest";
import { encodeParameters } from "@tevm/voltaire/Abi";
import { Address } from "@tevm/voltaire/Address";
import * as Hex from "@tevm/voltaire/Hex";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import {
	ProviderService,
	type ProviderShape,
} from "../../services/Provider/index.js";
import { VerifyError } from "../Signature/errors.js";
import { unwrapSignature, verifySignature, wrapSignature } from "./index.js";

const ERC6492_SUFFIX =
	"6492649264926492649264926492649264926492649264926492649264926492";

const factoryAddress = "0x000000000000000000000000000000000000dead" as const;
const factoryData = "0x1234" as const;
const innerSignature = `0x${"11".repeat(65)}` as `0x${string}`;
const messageHash = `0x${"22".repeat(32)}` as `0x${string}`;
const signer = "0x000000000000000000000000000000000000babe" as const;

const VALIDATOR_PARAMS = [
	{ type: "address", name: "signer" },
	{ type: "bytes32", name: "hash" },
	{ type: "bytes", name: "signature" },
] as const;

describe("ERC6492", () => {
	it.effect("wraps and unwraps signatures", () =>
		Effect.gen(function* () {
			const wrapped = yield* wrapSignature({
				signature: innerSignature,
				factoryAddress,
				factoryData,
			});

			expect(wrapped.endsWith(ERC6492_SUFFIX)).toBe(true);

			const unwrapped = yield* unwrapSignature(wrapped);
			expect(unwrapped).not.toBeNull();
			if (!unwrapped) return;

			expect(Address.toHex(unwrapped.factoryAddress)).toBe(factoryAddress);
			expect(Hex.toBytes(unwrapped.factoryData)).toEqual(
				Hex.toBytes(factoryData),
			);
			expect(Hex.toBytes(unwrapped.signature)).toEqual(
				Hex.toBytes(innerSignature),
			);
		}),
	);

	it.effect("returns null for non-wrapped signatures", () =>
		Effect.gen(function* () {
			const unwrapped = yield* unwrapSignature(innerSignature);
			expect(unwrapped).toBeNull();
		}),
	);

	it.effect("verifies using deployless validator", () =>
		Effect.gen(function* () {
			const calls: Array<{ data?: string }> = [];

			const mockProvider: ProviderShape = {
				request: <T>(method: string, params?: unknown[]) => {
					if (method === "eth_call") {
						const tx = params?.[0] as { data?: string };
						calls.push(tx);
						return Effect.succeed("0x01" as T);
					}
					return Effect.succeed(null as T);
				},
			};

			const MockProviderLayer = Layer.succeed(ProviderService, mockProvider);

			const result = yield* verifySignature({
				address: signer,
				message: messageHash,
				signature: innerSignature,
			}).pipe(Effect.provide(MockProviderLayer));

			expect(result).toBe(true);
			expect(calls.length).toBe(1);
			const callData = calls[0]?.data ?? "";
			const encodedParams = Hex.fromBytes(
				encodeParameters(
					VALIDATOR_PARAMS as any,
					[signer, messageHash, innerSignature] as any,
				),
			);
			expect(callData.endsWith(encodedParams.slice(2))).toBe(true);
		}),
	);

	it.effect("surfaces revert reason from validator", () =>
		Effect.gen(function* () {
			const revertData = Hex.fromBytes(
				encodeParameters([{ type: "string" }] as const, ["boom"] as any),
			);

			const mockProvider: ProviderShape = {
				request: <T>(method: string, _params?: unknown[]) => {
					if (method === "eth_call") {
						return Effect.succeed(
							`0x08c379a0${revertData.slice(2)}` as T,
						);
					}
					return Effect.succeed(null as T);
				},
			};

			const MockProviderLayer = Layer.succeed(ProviderService, mockProvider);

			const exit = yield* Effect.exit(
				verifySignature({
					address: signer,
					message: messageHash,
					signature: innerSignature,
				}).pipe(Effect.provide(MockProviderLayer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
				const error = exit.cause.error as VerifyError;
				expect(error).toBeInstanceOf(VerifyError);
				expect(error.message).toContain("boom");
			}
		}),
	);
});
