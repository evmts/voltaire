import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
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
		it("generateMnemonic returns 12-word mnemonic", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				return yield* hdwallet.generateMnemonic(128);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeInstanceOf(Array);
			expect(result.length).toBe(12);
		});

		it("fromSeed returns HDNode", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				return yield* hdwallet.fromSeed(new Uint8Array(64));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeDefined();
		});

		it("derive returns HDNode", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				return yield* hdwallet.derive(node, "m/44'/60'/0'/0/0");
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeDefined();
		});

		it("mnemonicToSeed returns 64-byte seed", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				return yield* hdwallet.mnemonicToSeed([
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
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("getPrivateKey returns 32-byte key", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				return yield* hdwallet.getPrivateKey(node);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(32);
		});

		it("getPublicKey returns 33-byte key", async () => {
			const program = Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				return yield* hdwallet.getPublicKey(node);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HDWalletTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(33);
		});
	});
});

describe("derive", () => {
	it("derives with HDWalletService dependency", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const node = yield* hdwallet.fromSeed(new Uint8Array(64));
			return yield* derive(node, "m/44'/60'/0'/0/0");
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeDefined();
	});
});

describe("generateMnemonic", () => {
	it("generates mnemonic with HDWalletService dependency", async () => {
		const result = await Effect.runPromise(
			generateMnemonic(128).pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeInstanceOf(Array);
		expect(result.length).toBe(12);
	});
});

describe("fromSeed", () => {
	it("creates node from seed with HDWalletService dependency", async () => {
		const result = await Effect.runPromise(
			fromSeed(new Uint8Array(64)).pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeDefined();
	});
});

describe("mnemonicToSeed", () => {
	it("converts mnemonic to seed with HDWalletService dependency", async () => {
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
		const result = await Effect.runPromise(
			mnemonicToSeed(mnemonic).pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});
});

describe("getPrivateKey", () => {
	it("gets private key with HDWalletService dependency", async () => {
		const program = Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			return yield* getPrivateKey(node);
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result?.length).toBe(32);
	});
});

describe("getPublicKey", () => {
	it("gets public key with HDWalletService dependency", async () => {
		const program = Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			return yield* getPublicKey(node);
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(HDWalletTest)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result?.length).toBe(33);
	});
});
