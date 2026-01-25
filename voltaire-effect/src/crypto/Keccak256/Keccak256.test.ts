import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { hash, KeccakLive, KeccakService, KeccakTest } from "./index.js";

const bytesToHex = (bytes: Uint8Array): string => {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

describe("KeccakService", () => {
	describe("KeccakLive", () => {
		it("hashes data using Voltaire Keccak256", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakLive)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("produces correct hash for known input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakLive)),
			);

			// keccak256 of empty input
			expect(result[0]).toBe(0xc5);
			expect(result[1]).toBe(0xd2);
		});
	});

	describe("Known Vector Tests", () => {
		it("matches known vector: empty string", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(0));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			);
		});

		it('matches known vector: "hello"', async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(
					new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]),
				); // "hello"
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			);
		});

		it('matches known vector: "Hello, World!"', async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const input = new TextEncoder().encode("Hello, World!");
				return yield* keccak.hash(input);
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xacaf3289d7b601cbd114fb36c4d29c85bbfd5e133f14cb355c3fd8d99367964f",
			);
		});

		it("matches known vector: single zero byte", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([0x00]));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a",
			);
		});

		it("matches known vector: 0xff byte", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([0xff]));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x8b1a944cf13a9a1c08facb2c9e98623ef3254d2ddb48113885c3e8e97fec8db9",
			);
		});
	});

	describe("KeccakTest", () => {
		it("returns deterministic zero-filled hash", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(KeccakTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result.every((b) => b === 0)).toBe(true);
		});
	});
});

describe("hash", () => {
	it("hashes data with KeccakService dependency", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(KeccakLive)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("works with test layer", async () => {
		const data = new Uint8Array([1, 2, 3]);
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(KeccakTest)),
		);

		expect(result.every((b) => b === 0)).toBe(true);
	});
});
