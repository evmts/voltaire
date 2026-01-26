import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	Bip39Live,
	Bip39Service,
	Bip39Test,
	generateMnemonic,
	getWordCount,
	mnemonicToSeed,
	validateMnemonic,
} from "./index.js";

const TEST_MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

describe("Bip39Service", () => {
	describe("Bip39Live", () => {
		it.effect("generates 12-word mnemonic (128 bits)", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.generateMnemonic(128);
				expect(typeof result).toBe("string");
				expect(result.split(" ").length).toBe(12);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("generates 24-word mnemonic (256 bits)", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.generateMnemonic(256);
				expect(result.split(" ").length).toBe(24);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("validates known valid mnemonic", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.validateMnemonic(TEST_MNEMONIC);
				expect(result).toBe(true);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("rejects invalid mnemonic", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.validateMnemonic("invalid mnemonic phrase");
				expect(result).toBe(false);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("converts mnemonic to seed", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.mnemonicToSeed(TEST_MNEMONIC);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("converts mnemonic to seed with passphrase", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const seedWithPass = yield* bip39.mnemonicToSeed(
					TEST_MNEMONIC,
					"password",
				);
				const seedWithoutPass = yield* bip39.mnemonicToSeed(TEST_MNEMONIC);
				expect(seedWithPass.length).toBe(64);
				expect(seedWithoutPass.length).toBe(64);
				expect(Buffer.from(seedWithPass).toString("hex")).not.toBe(
					Buffer.from(seedWithoutPass).toString("hex"),
				);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("gets word count from entropy bits", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.getWordCount(128);
				expect(result).toBe(12);
			}).pipe(Effect.provide(Bip39Live))
		);

		it.effect("gets word count for 256 bits", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.getWordCount(256);
				expect(result).toBe(24);
			}).pipe(Effect.provide(Bip39Live))
		);
	});

	describe("Bip39Test", () => {
		it.effect("returns test mnemonic", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.generateMnemonic();
				expect(result).toBe(TEST_MNEMONIC);
			}).pipe(Effect.provide(Bip39Test))
		);

		it.effect("always validates as true", () =>
			Effect.gen(function* () {
				const bip39 = yield* Bip39Service;
				const result = yield* bip39.validateMnemonic("anything");
				expect(result).toBe(true);
			}).pipe(Effect.provide(Bip39Test))
		);
	});
});

describe("convenience functions", () => {
	it.effect("generateMnemonic works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* generateMnemonic(128);
			expect(result.split(" ").length).toBe(12);
		}).pipe(Effect.provide(Bip39Live))
	);

	it.effect("validateMnemonic works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* validateMnemonic(TEST_MNEMONIC);
			expect(result).toBe(true);
		}).pipe(Effect.provide(Bip39Live))
	);

	it.effect("mnemonicToSeed works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* mnemonicToSeed(TEST_MNEMONIC);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		}).pipe(Effect.provide(Bip39Live))
	);

	it.effect("getWordCount works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* getWordCount(128);
			expect(result).toBe(12);
		}).pipe(Effect.provide(Bip39Live))
	);
});
