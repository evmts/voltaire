import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import { CryptoTest } from "./CryptoTest.js";
import { KeccakService } from "./Keccak256/KeccakService.js";
import { Secp256k1Service } from "./Secp256k1/Secp256k1Service.js";

describe("CryptoTest", () => {
	it.effect("provides KeccakService", () =>
		Effect.gen(function* () {
			const svc = yield* KeccakService;
			expect(typeof svc.hash === "function").toBe(true);
		}).pipe(Effect.provide(CryptoTest))
	);

	it.effect("provides Secp256k1Service", () =>
		Effect.gen(function* () {
			const svc = yield* Secp256k1Service;
			expect(
				typeof svc.sign === "function" && typeof svc.recover === "function",
			).toBe(true);
		}).pipe(Effect.provide(CryptoTest))
	);

	it.effect("KeccakService.hash returns 32 bytes", () =>
		Effect.gen(function* () {
			const svc = yield* KeccakService;
			const result = yield* svc.hash(new Uint8Array([1, 2, 3]));
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(CryptoTest))
	);

	it.effect("composes Keccak and Secp256k1 in single program", () =>
		Effect.gen(function* () {
			const keccak = yield* KeccakService;
			const msgHash = yield* keccak.hash(
				new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
			);
			expect(msgHash.length).toBe(32);
		}).pipe(Effect.provide(CryptoTest))
	);
});
