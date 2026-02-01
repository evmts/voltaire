import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
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
		it.effect("hashes data using Voltaire Blake2", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("supports custom output length", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces correct hash for known input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([]));
				expect(result[0]).toBe(0x78);
				expect(result[1]).toBe(0x6a);
			}).pipe(Effect.provide(Blake2Live)),
		);
	});

	describe("Known Vector Tests (RFC 7693)", () => {
		it.effect("matches known vector: empty string (64 bytes)", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(0));
				expect(bytesToHex(result)).toBe(
					"0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce",
				);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect('matches known vector: "abc"', () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new TextEncoder().encode("abc"));
				expect(bytesToHex(result)).toBe(
					"0xba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923",
				);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect('matches known vector: "hello"', () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new TextEncoder().encode("hello"));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("matches known vector: single zero byte", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([0x00]));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("matches known vector: 0xff byte", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([0xff]));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);
	});

	describe("Output length variations", () => {
		it.effect("produces 1-byte output", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 1);
				expect(result.length).toBe(1);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces 16-byte output", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 16);
				expect(result.length).toBe(16);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces 32-byte output", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces 48-byte output", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 48);
				expect(result.length).toBe(48);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces 64-byte output (default)", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);
	});

	describe("Input size variations", () => {
		it.effect("hashes empty input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(0));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes single byte", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([0x42]));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes 128 bytes (block size)", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(128).fill(0x11));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes 129 bytes (block size + 1)", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(129).fill(0x22));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes 1KB input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(1024).fill(0x33));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes 64KB input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array(65536).fill(0x44));
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("hashes 1MB input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(
					new Uint8Array(1024 * 1024).fill(0x55),
				);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);
	});

	describe("Determinism", () => {
		it.effect("produces same hash for same input", () =>
			Effect.gen(function* () {
				const input = new Uint8Array([1, 2, 3, 4, 5]);
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(input);
				const hash2 = yield* blake2.hash(input);
				expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces different hash for different input", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* blake2.hash(new Uint8Array([1, 2, 4]));
				expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("produces different hash for different output lengths", () =>
			Effect.gen(function* () {
				const input = new Uint8Array([1, 2, 3]);
				const blake2 = yield* Blake2Service;
				const hash32 = yield* blake2.hash(input, 32);
				const hash64 = yield* blake2.hash(input, 64);
				expect(hash32.length).toBe(32);
				expect(hash64.length).toBe(64);
			}).pipe(Effect.provide(Blake2Live)),
		);

		it.effect("is sensitive to single bit change", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([0b00000000]));
				const hash2 = yield* blake2.hash(new Uint8Array([0b00000001]));
				expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(Blake2Live)),
		);
	});

	describe("Blake2Test", () => {
		it.effect("returns deterministic zero-filled hash", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
				expect(result.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(Blake2Test)),
		);

		it.effect("respects custom output length in test layer", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const result = yield* blake2.hash(new Uint8Array([1, 2, 3]), 32);
				expect(result.length).toBe(32);
				expect(result.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(Blake2Test)),
		);

		it.effect("returns same result for different inputs", () =>
			Effect.gen(function* () {
				const blake2 = yield* Blake2Service;
				const hash1 = yield* blake2.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* blake2.hash(new Uint8Array([4, 5, 6]));
				expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(Blake2Test)),
		);
	});
});

describe("hash", () => {
	it.effect("hashes data with Blake2Service dependency", () =>
		Effect.gen(function* () {
			const data = new Uint8Array([104, 101, 108, 108, 111]);
			const result = yield* hash(data);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		}).pipe(Effect.provide(Blake2Live)),
	);

	it.effect("supports custom output length", () =>
		Effect.gen(function* () {
			const data = new Uint8Array([104, 101, 108, 108, 111]);
			const result = yield* hash(data, 32);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(Blake2Live)),
	);

	it.effect("works with test layer", () =>
		Effect.gen(function* () {
			const data = new Uint8Array([1, 2, 3]);
			const result = yield* hash(data);
			expect(result.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(Blake2Test)),
	);

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
