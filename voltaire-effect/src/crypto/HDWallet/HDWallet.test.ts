import { describe, expect, it } from "@effect/vitest";
import { HDWallet } from "@tevm/voltaire/native";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import {
	derive,
	fromMnemonic,
	fromSeed,
	generateMnemonic,
	getPrivateKey,
	getPublicKey,
	mnemonicToSeed,
	withPrivateKey,
	withSeed,
} from "./derive.js";
import {
	HardenedDerivationError,
	InvalidKeyError,
	InvalidPathError,
	InvalidSeedError,
} from "./errors.js";
import { HDWalletLive } from "./HDWalletLive.js";
import { HDWalletService, HDWalletTest } from "./HDWalletService.js";

describe("HDWalletService", () => {
	describe("HDWalletTest", () => {
		it.effect("generateMnemonic returns 12-word mnemonic", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const result = yield* hdwallet.generateMnemonic(128);
				expect(typeof result).toBe("string");
				expect(result.split(" ").length).toBe(12);
			}).pipe(Effect.provide(HDWalletTest)),
		);

		it.effect("fromSeed returns HDNode", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const result = yield* hdwallet.fromSeed(new Uint8Array(64));
				expect(result).toBeDefined();
			}).pipe(Effect.provide(HDWalletTest)),
		);

		it.effect("derive returns HDNode", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.derive(node, "m/44'/60'/0'/0/0");
				expect(result).toBeDefined();
			}).pipe(Effect.provide(HDWalletTest)),
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
			}).pipe(Effect.provide(HDWalletTest)),
		);

		it.effect("getPrivateKey returns 32-byte key", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.getPrivateKey(node);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result?.length).toBe(32);
			}).pipe(Effect.provide(HDWalletTest)),
		);

		it.effect("getPublicKey returns 33-byte key", () =>
			Effect.gen(function* () {
				const hdwallet = yield* HDWalletService;
				const node = yield* hdwallet.fromSeed(new Uint8Array(64));
				const result = yield* hdwallet.getPublicKey(node);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result?.length).toBe(33);
			}).pipe(Effect.provide(HDWalletTest)),
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
		}).pipe(Effect.provide(HDWalletTest)),
	);
});

describe("generateMnemonic", () => {
	it.effect("generates mnemonic with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const result = yield* generateMnemonic(128);
			expect(typeof result).toBe("string");
			expect(result.split(" ").length).toBe(12);
		}).pipe(Effect.provide(HDWalletTest)),
	);
});

describe("fromSeed", () => {
	it.effect("creates node from seed with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const result = yield* fromSeed(new Uint8Array(64));
			expect(result).toBeDefined();
		}).pipe(Effect.provide(HDWalletTest)),
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
		}).pipe(Effect.provide(HDWalletTest)),
	);
});

describe("getPrivateKey", () => {
	it.effect("gets private key with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			const result = yield* getPrivateKey(node);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(32);
		}).pipe(Effect.provide(HDWalletTest)),
	);
});

describe("getPublicKey", () => {
	it.effect("gets public key with HDWalletService dependency", () =>
		Effect.gen(function* () {
			const node = yield* fromSeed(new Uint8Array(64));
			const result = yield* getPublicKey(node);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result?.length).toBe(33);
		}).pipe(Effect.provide(HDWalletTest)),
	);
});

describe("HDWallet error types", () => {
	const validSeed = new Uint8Array(32).fill(0x42);

	it("has unique error tags", () => {
		const tags = new Set([
			new InvalidPathError({ path: "", message: "" })._tag,
			new InvalidSeedError({ seedLength: 0, message: "" })._tag,
			new HardenedDerivationError({ path: "", index: 0, message: "" })._tag,
			new InvalidKeyError({ message: "" })._tag,
		]);
		expect(tags.size).toBe(4);
	});

	it("InvalidPathError is catchable with Effect.catchTag", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const master = yield* hdwallet.fromSeed(validSeed);
			return yield* hdwallet.derive(master, "invalid/path");
		}).pipe(
			Effect.provide(HDWalletLive),
			Effect.catchTag("InvalidPathError", (error) =>
				Effect.succeed(`caught: ${error.path}`),
			),
		);

		const result = await Effect.runPromise(program);
		expect(result).toBe("caught: invalid/path");
	});

	it("derive fails with InvalidPathError for malformed path", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const master = yield* hdwallet.fromSeed(validSeed);
			return yield* hdwallet.derive(master, "invalid/path");
		}).pipe(Effect.provide(HDWalletLive));

		const exit = await Effect.runPromiseExit(program);
		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
			expect(exit.cause.error._tag).toBe("InvalidPathError");
		}
	});

	it("derive fails with HardenedDerivationError from public key", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const master = yield* hdwallet.fromSeed(validSeed);
			const publicNode = HDWallet.toPublic(master as any);
			return yield* hdwallet.derive(publicNode as any, "m/44'");
		}).pipe(Effect.provide(HDWalletLive));

		const exit = await Effect.runPromiseExit(program);
		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
			expect(exit.cause.error._tag).toBe("HardenedDerivationError");
		}
	});

	it("derive succeeds with non-hardened path from public key", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			const master = yield* hdwallet.fromSeed(validSeed);
			const publicNode = HDWallet.toPublic(master as any);
			return yield* hdwallet.derive(publicNode as any, "m/0");
		}).pipe(Effect.provide(HDWalletLive));

		const result = await Effect.runPromise(program);
		expect(result).toBeDefined();
	});

	it("fromSeed fails with InvalidSeedError for too short seed", async () => {
		const program = Effect.gen(function* () {
			const hdwallet = yield* HDWalletService;
			return yield* hdwallet.fromSeed(new Uint8Array(15));
		}).pipe(Effect.provide(HDWalletLive));

		const exit = await Effect.runPromiseExit(program);
		expect(Exit.isFailure(exit)).toBe(true);
		if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
			expect(exit.cause.error._tag).toBe("InvalidSeedError");
			expect((exit.cause.error as InvalidSeedError).seedLength).toBe(15);
		}
	});

	it("fromMnemonic succeeds with valid mnemonic", async () => {
		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const result = await Effect.runPromise(
			fromMnemonic(mnemonic).pipe(Effect.provide(HDWalletLive)),
		);
		expect(result).toBeDefined();
	});
});

describe("withPrivateKey", () => {
	const validSeed = new Uint8Array(32).fill(0x42);

	it.effect("zeroes private key after use", () =>
		Effect.gen(function* () {
			const master = yield* fromSeed(validSeed);
			let capturedKey: Uint8Array | null = null;

			yield* withPrivateKey(master, (key) =>
				Effect.sync(() => {
					capturedKey = key;
					expect(key.some((b) => b !== 0)).toBe(true);
				}),
			);

			expect(capturedKey).not.toBeNull();
			expect(capturedKey?.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HDWalletLive)),
	);

	it.effect("zeroes private key even on error", () =>
		Effect.gen(function* () {
			const master = yield* fromSeed(validSeed);
			let capturedKey: Uint8Array | null = null;

			const exit = yield* Effect.exit(
				withPrivateKey(master, (key) =>
					Effect.sync(() => {
						capturedKey = key;
						throw new Error("test error");
					}),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			expect(capturedKey).not.toBeNull();
			expect(capturedKey?.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HDWalletLive)),
	);

	it.effect("fails with InvalidKeyError for public-only node", () =>
		Effect.gen(function* () {
			const master = yield* fromSeed(validSeed);
			const publicNode = HDWallet.toPublic(master as any);

			const exit = yield* Effect.exit(
				withPrivateKey(publicNode as any, (key) => Effect.succeed(key)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit) && exit.cause._tag === "Fail") {
				expect(exit.cause.error._tag).toBe("InvalidKeyError");
			}
		}).pipe(Effect.provide(HDWalletLive)),
	);
});

describe("withSeed", () => {
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

	it.effect("zeroes seed after use", () =>
		Effect.gen(function* () {
			let capturedSeed: Uint8Array | null = null;

			yield* withSeed(mnemonic, (seed) =>
				Effect.sync(() => {
					capturedSeed = seed;
					expect(seed.length).toBe(64);
					expect(seed.some((b) => b !== 0)).toBe(true);
				}),
			);

			expect(capturedSeed).not.toBeNull();
			expect(capturedSeed?.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HDWalletLive)),
	);

	it.effect("zeroes seed even on error", () =>
		Effect.gen(function* () {
			let capturedSeed: Uint8Array | null = null;

			const exit = yield* Effect.exit(
				withSeed(mnemonic, (seed) =>
					Effect.sync(() => {
						capturedSeed = seed;
						throw new Error("test error");
					}),
				),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			expect(capturedSeed).not.toBeNull();
			expect(capturedSeed?.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HDWalletLive)),
	);
});
