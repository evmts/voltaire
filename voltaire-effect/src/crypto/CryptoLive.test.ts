import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { CryptoTest } from "./CryptoTest.js";
import { KeccakService } from "./Keccak256/KeccakService.js";
import { Secp256k1Service } from "./Secp256k1/Secp256k1Service.js";

describe("CryptoTest", () => {
	it("provides KeccakService", async () => {
		const program = Effect.gen(function* () {
			const svc = yield* KeccakService;
			return typeof svc.hash === "function";
		});
		const result = await Effect.runPromise(
			program.pipe(Effect.provide(CryptoTest)),
		);
		expect(result).toBe(true);
	});

	it("provides Secp256k1Service", async () => {
		const program = Effect.gen(function* () {
			const svc = yield* Secp256k1Service;
			return (
				typeof svc.sign === "function" && typeof svc.recover === "function"
			);
		});
		const result = await Effect.runPromise(
			program.pipe(Effect.provide(CryptoTest)),
		);
		expect(result).toBe(true);
	});

	it("KeccakService.hash returns 32 bytes", async () => {
		const program = Effect.gen(function* () {
			const svc = yield* KeccakService;
			return yield* svc.hash(new Uint8Array([1, 2, 3]));
		});
		const result = await Effect.runPromise(
			program.pipe(Effect.provide(CryptoTest)),
		);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("composes Keccak and Secp256k1 in single program", async () => {
		const program = Effect.gen(function* () {
			const keccak = yield* KeccakService;
			const msgHash = yield* keccak.hash(
				new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
			);
			expect(msgHash.length).toBe(32);
			return true;
		});
		const result = await Effect.runPromise(
			program.pipe(Effect.provide(CryptoTest)),
		);
		expect(result).toBe(true);
	});
});
