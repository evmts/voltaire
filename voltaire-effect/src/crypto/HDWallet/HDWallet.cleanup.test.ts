/**
 * @fileoverview Tests verifying memory cleanup for private keys and seeds.
 * These tests use a mock layer to avoid native FFI dependency.
 */
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { withPrivateKey, withSeed } from "./derive.js";
import { HDWalletService } from "./HDWalletService.js";

// Test layer that provides real Uint8Array data we can verify is zeroed
const TestWithDataLayer = Layer.succeed(HDWalletService, {
	derive: () => Effect.succeed({}),
	generateMnemonic: () =>
		Effect.succeed(
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
		),
	fromSeed: () => Effect.succeed({}),
	fromMnemonic: () => Effect.succeed({}),
	mnemonicToSeed: () => Effect.succeed(new Uint8Array(64).fill(42)),
	getPrivateKey: () => Effect.succeed(new Uint8Array(32).fill(99)),
	getPublicKey: () => Effect.succeed(new Uint8Array(33).fill(88)),
});

describe("withPrivateKey memory cleanup", () => {
	it("zeroes private key after normal use", async () => {
		let capturedKey: Uint8Array | null = null;

		const program = Effect.gen(function* () {
			const master = {};
			yield* withPrivateKey(master, (key) =>
				Effect.sync(() => {
					capturedKey = key;
					expect(key.some((b) => b !== 0)).toBe(true);
				}),
			);
		}).pipe(Effect.provide(TestWithDataLayer));

		await Effect.runPromise(program);

		expect(capturedKey).not.toBeNull();
		expect(capturedKey?.every((b) => b === 0)).toBe(true);
	});

	it("zeroes private key even when use effect fails", async () => {
		let capturedKey: Uint8Array | null = null;

		const program = Effect.gen(function* () {
			const master = {};
			yield* withPrivateKey(master, (key) =>
				Effect.sync(() => {
					capturedKey = key;
					throw new Error("deliberate test error");
				}),
			);
		}).pipe(Effect.provide(TestWithDataLayer));

		const exit = await Effect.runPromiseExit(program);

		expect(Exit.isFailure(exit)).toBe(true);
		expect(capturedKey).not.toBeNull();
		expect(capturedKey?.every((b) => b === 0)).toBe(true);
	});
});

describe("withSeed memory cleanup", () => {
	const mnemonic = [
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"abandon",
		"about",
	];

	it("zeroes seed after normal use", async () => {
		let capturedSeed: Uint8Array | null = null;

		const program = Effect.gen(function* () {
			yield* withSeed(mnemonic, (seed) =>
				Effect.sync(() => {
					capturedSeed = seed;
					expect(seed.length).toBe(64);
					expect(seed.some((b) => b !== 0)).toBe(true);
				}),
			);
		}).pipe(Effect.provide(TestWithDataLayer));

		await Effect.runPromise(program);

		expect(capturedSeed).not.toBeNull();
		expect(capturedSeed?.every((b) => b === 0)).toBe(true);
	});

	it("zeroes seed even when use effect fails", async () => {
		let capturedSeed: Uint8Array | null = null;

		const program = Effect.gen(function* () {
			yield* withSeed(mnemonic, (seed) =>
				Effect.sync(() => {
					capturedSeed = seed;
					throw new Error("deliberate test error");
				}),
			);
		}).pipe(Effect.provide(TestWithDataLayer));

		const exit = await Effect.runPromiseExit(program);

		expect(Exit.isFailure(exit)).toBe(true);
		expect(capturedSeed).not.toBeNull();
		expect(capturedSeed?.every((b) => b === 0)).toBe(true);
	});
});
