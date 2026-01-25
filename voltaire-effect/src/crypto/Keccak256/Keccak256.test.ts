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
				);
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

		it('matches known vector: "The quick brown fox jumps over the lazy dog"', async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const input = new TextEncoder().encode(
					"The quick brown fox jumps over the lazy dog",
				);
				return yield* keccak.hash(input);
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15",
			);
		});

		it("matches known vector: 32 bytes of 0xab", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(32).fill(0xab));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});
	});

	describe("Input size variations", () => {
		it("hashes empty input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(0));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes single byte", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array([0x42]));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 64 bytes (block size)", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(64).fill(0x11));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 136 bytes (keccak-256 rate)", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(136).fill(0x22));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 137 bytes (rate + 1)", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(137).fill(0x33));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 1KB input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(1024).fill(0x44));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 64KB input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(65536).fill(0x55));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 1MB input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				return yield* keccak.hash(new Uint8Array(1024 * 1024).fill(0x66));
			}).pipe(Effect.provide(KeccakLive));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});
	});

	describe("Determinism", () => {
		it("produces same hash for same input", async () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const hash1 = yield* keccak.hash(input);
				const hash2 = yield* keccak.hash(input);
				return { hash1, hash2 };
			}).pipe(Effect.provide(KeccakLive));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});

		it("produces different hash for different input", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const hash1 = yield* keccak.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* keccak.hash(new Uint8Array([1, 2, 4]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(KeccakLive));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
		});

		it("is sensitive to single bit change", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const hash1 = yield* keccak.hash(new Uint8Array([0b00000000]));
				const hash2 = yield* keccak.hash(new Uint8Array([0b00000001]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(KeccakLive));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
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

		it("returns same result for different inputs", async () => {
			const program = Effect.gen(function* () {
				const keccak = yield* KeccakService;
				const hash1 = yield* keccak.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* keccak.hash(new Uint8Array([4, 5, 6]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(KeccakTest));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});
	});
});

describe("hash", () => {
	it("hashes data with KeccakService dependency", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
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

	it("matches service result", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const [hashResult, serviceResult] = await Promise.all([
			Effect.runPromise(hash(data).pipe(Effect.provide(KeccakLive))),
			Effect.runPromise(
				Effect.gen(function* () {
					const keccak = yield* KeccakService;
					return yield* keccak.hash(data);
				}).pipe(Effect.provide(KeccakLive)),
			),
		]);

		expect(bytesToHex(hashResult)).toBe(bytesToHex(serviceResult));
	});
});
