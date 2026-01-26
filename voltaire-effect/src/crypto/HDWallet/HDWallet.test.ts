import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	derive,
	fromSeed,
	generateMnemonic,
	getPrivateKey,
	getPublicKey,
	mnemonicToSeed,
} from "./derive.js";
import { HDWalletService, HDWalletTest } from "./HDWalletService.js";

describe("HDWalletService", () => {
	describe("HDWalletTest", () => {
		it.effect("generateMnemonic returns 12-word mnemonic", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const result = yield* hdwallet.generateMnemonic(128);
				expect(result).toBeInstanceOf(Array);
				expect(result.length).toBe(12);
			}).pipe(Effect.provide(HDWalletTest))
		);

		it.effect("fromSeed returns HDNode", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const result = yield* hdwallet.fromSeed(new Uint8Array(64));
				expect(result).toBeDefined();
			}).pipe(Effect.provide(HDWalletTest))
		);

		it.effect("derive returns HDNode", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.derive(node, "m/44'/60'/0'/0/0");
				expect(result).toBeDefined();
			}).pipe(Effect.provide(HDWalletTest))
		);

		it.effect("mnemonicToSeed returns 64-byte seed", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const result = yield* hdwallet.mnemonicToSeed([
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
				]);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(HDWalletTest))
		);

		it.effect("getPrivateKey returns 32-byte key", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.getPrivateKey(node);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result?.length).toBe(32);
			}).pipe(Effect.provide(HDWalletTest))
		);

		it.effect("getPublicKey returns 33-byte key", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.getPublicKey(node);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result?.length).toBe(33);
			}).pipe(Effect.provide(HDWalletTest))
		);
	});
});

describe("derive", () => {
	it.effect("derives with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const node = yield* hdwallet.fromSeed(new Uint8Array(64));
			const result = yield* derive(node, "m/44'/60'/0'/0/0");
			expect(result).toBeDefined();
		}).pipe(Effect.provide(HDWalletTest))
	);
});

describe("generateMnemonic", () => {
	it.effect("generates mnemonic with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const result = yield* generateMnemonic(128);
			expect(result).toBeInstanceOf(Array);
			expect(result.length).toBe(12);
		}).pipe(Effect.provide(HDWalletTest))
	);
});

describe("fromSeed", () => {
	it.effect("creates node from seed with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const result = yield* fromSeed(new Uint8Array(64));
			expect(result).toBeDefined();
		}).pipe(Effect.provide(HDWalletTest))
	);
});

describe("mnemonicToSeed", () => {
	it.effect("converts mnemonic to seed with HDWalletService dependency", () =>
		Effect.gen(function* () {
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
			const result = yield* mnemonicToSeed(mnemonic);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		}).pipe(Effect.provide(HDWalletTest))
	);
});

describe("getPrivateKey", () => {
	it.effect("gets private key with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			const result = yield* getPrivateKey(node);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(32);
		}).pipe(Effect.provide(HDWalletTest))
	);
});

describe("getPublicKey", () => {
	it.effect("gets public key with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			const result = yield* getPublicKey(node);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(33);
		}).pipe(Effect.provide(HDWalletTest))
	);
});
