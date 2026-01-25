import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { Blake2Live, Blake2Service, Blake2Test, hash } from "./index.js";

const bytesToHex = (bytes: Uint8Array): string => {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

describe("Blake2Service", () => {
	describe("Blake2Live", () => {
		it("hashes data using Voltaire Blake2", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Blake2Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("supports custom output length", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Blake2Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("produces correct hash for known input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Blake2Live)),
			);

			expect(result[0]).toBe(0x78);
			expect(result[1]).toBe(0x6a);
		});
	});

	describe("Known Vector Tests (RFC 7693)", () => {
		it("matches known vector: empty string (64 bytes)", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(0));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
			);
		});

		it('matches known vector: "abc"', async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new TextEncoder().encode("abc"));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
			);
		});

		it('matches known vector: "hello"', async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new TextEncoder().encode("hello"));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("matches known vector: single zero byte", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([0x00]));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("matches known vector: 0xff byte", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([0xff]));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});
	});

	describe("Output length variations", () => {
		it("produces 1-byte output", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 1);
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(1);
		});

		it("produces 16-byte output", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 16);
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(16);
		});

		it("produces 32-byte output", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("produces 48-byte output", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 48);
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(48);
		});

		it("produces 64-byte output (default)", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});
	});

	describe("Input size variations", () => {
		it("hashes empty input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(0));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes single byte", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([0x42]));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes 128 bytes (block size)", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(128).fill(0x11));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes 129 bytes (block size + 1)", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(129).fill(0x22));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes 1KB input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(1024).fill(0x33));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes 64KB input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(65536).fill(0x44));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});

		it("hashes 1MB input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array(1024 * 1024).fill(0x55));
			}).pipe(Effect.provide(Blake2Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(64);
		});
	});

	describe("Determinism", () => {
		it("produces same hash for same input", async () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(input);
				const hash2 = yield* blake2.hash(input);
				return { hash1, hash2 };
			}).pipe(Effect.provide(Blake2Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});

		it("produces different hash for different input", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* blake2.hash(new Uint8Array([1, 2, 4]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(Blake2Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
		});

		it("produces different hash for different output lengths", async () => {
			const input = new Uint8Array([1, 2, 3]);
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash32 = yield* blake2.hash(input, 32);
				const hash64 = yield* blake2.hash(input, 64);
				return { hash32, hash64 };
			}).pipe(Effect.provide(Blake2Live));

			const { hash32, hash64 } = await Effect.runPromise(program);
			expect(hash32.length).toBe(32);
			expect(hash64.length).toBe(64);
		});

		it("is sensitive to single bit change", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([0b00000000]));
				const hash2 = yield* blake2.hash(new Uint8Array([0b00000001]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(Blake2Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
		});
	});

	describe("Blake2Test", () => {
		it("returns deterministic zero-filled hash", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Blake2Test)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("respects custom output length in test layer", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				return yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Blake2Test)),
			);

			expect(result.length).toBe(32);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("returns same result for different inputs", async () => {
			const program = Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* blake2.hash(new Uint8Array([4, 5, 6]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(Blake2Test));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});
	});
});

describe("hash", () => {
	it("hashes data with Blake2Service dependency", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(Blake2Live)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it("supports custom output length", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const result = await Effect.runPromise(
			hash(data, 32).pipe(Effect.provide(Blake2Live)),
		);

		expect(result.length).toBe(32);
	});

	it("works with test layer", async () => {
		const data = new Uint8Array([1, 2, 3]);
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(Blake2Test)),
		);

		expect(result.every((b) => b === 0)).toBe(true);
	});

	it("matches service result", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const [hashResult, serviceResult] = await Promise.all([
			Effect.runPromise(hash(data).pipe(Effect.provide(Blake2Live))),
			Effect.runPromise(
				Effect.gen(function* () {
					const blake2 = yield* Blake2Service;
					return yield* blake2.hash(data);
				}).pipe(Effect.provide(Blake2Live)),
			),
		]);

		expect(bytesToHex(hashResult)).toBe(bytesToHex(serviceResult));
	});

	it("matches service result with custom length", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const [hashResult, serviceResult] = await Promise.all([
			Effect.runPromise(hash(data, 32).pipe(Effect.provide(Blake2Live))),
			Effect.runPromise(
				Effect.gen(function* () {
					const blake2 = yield* Blake2Service;
					return yield* blake2.hash(data, 32);
				}).pipe(Effect.provide(Blake2Live)),
			),
		]);

		expect(bytesToHex(hashResult)).toBe(bytesToHex(serviceResult));
	});
});
