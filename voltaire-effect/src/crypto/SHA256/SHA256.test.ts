import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import { hash, SHA256Live, SHA256Service, SHA256Test } from "./index.js";

const bytesToHex = (bytes: Uint8Array): string => {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

describe("SHA256Service", () => {
	describe("SHA256Live", () => {
		it.effect("hashes data using Voltaire SHA256", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("produces correct hash for known input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([]));
				expect(result[0]).toBe(0xe3);
				expect(result[1]).toBe(0xb0);
			}).pipe(Effect.provide(SHA256Live)),
		);
	});

	describe("Known Vector Tests (NIST FIPS 180-4)", () => {
		it.effect("matches known vector: empty string", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(0));
				expect(bytesToHex(result)).toBe(
					"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect('matches known vector: "abc"', () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new TextEncoder().encode("abc"));
				expect(bytesToHex(result)).toBe(
					"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect('matches known vector: "hello"', () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new TextEncoder().encode("hello"));
				expect(bytesToHex(result)).toBe(
					"0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect(
			'matches known vector: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"',
			() =>
				Effect.gen(function* () {
					const sha256 = yield* SHA256Service;
					const result = yield* sha256.hash(
						new TextEncoder().encode(
							"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
						),
					);
					expect(bytesToHex(result)).toBe(
						"0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
					);
				}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect(
			'matches known vector: "The quick brown fox jumps over the lazy dog"',
			() =>
				Effect.gen(function* () {
					const sha256 = yield* SHA256Service;
					const result = yield* sha256.hash(
						new TextEncoder().encode(
							"The quick brown fox jumps over the lazy dog",
						),
					);
					expect(bytesToHex(result)).toBe(
						"0xd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
					);
				}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("matches known vector: single zero byte", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([0x00]));
				expect(bytesToHex(result)).toBe(
					"0x6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("matches known vector: 0xff byte", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([0xff]));
				expect(bytesToHex(result)).toBe(
					"0xa8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);
	});

	describe("Input size variations", () => {
		it.effect("hashes empty input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(0));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes single byte", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([0x42]));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 55 bytes (single block without padding overflow)", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(55).fill(0x11));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 56 bytes (padding overflow boundary)", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(56).fill(0x22));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 64 bytes (block size)", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(64).fill(0x33));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 1KB input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(1024).fill(0x44));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 64KB input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array(65536).fill(0x55));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("hashes 1MB input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(
					new Uint8Array(1024 * 1024).fill(0x66),
				);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(SHA256Live)),
		);
	});

	describe("Determinism", () => {
		it.effect("produces same hash for same input", () =>
			Effect.gen(function* () {
				const input = new Uint8Array([1, 2, 3, 4, 5]);
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(input);
				const hash2 = yield* sha256.hash(input);
				expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("produces different hash for different input", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* sha256.hash(new Uint8Array([1, 2, 4]));
				expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(SHA256Live)),
		);

		it.effect("is sensitive to single bit change", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([0b00000000]));
				const hash2 = yield* sha256.hash(new Uint8Array([0b00000001]));
				expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(SHA256Live)),
		);
	});

	describe("Double SHA256 (Bitcoin-style)", () => {
		it.effect("computes double SHA256", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const first = yield* sha256.hash(new TextEncoder().encode("hello"));
				const result = yield* sha256.hash(first);
				expect(result.length).toBe(32);
				expect(bytesToHex(result)).toBe(
					"0x9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50",
				);
			}).pipe(Effect.provide(SHA256Live)),
		);
	});

	describe("SHA256Test", () => {
		it.effect("returns deterministic zero-filled hash", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const result = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
				expect(result.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(SHA256Test)),
		);

		it.effect("returns same result for different inputs", () =>
			Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* sha256.hash(new Uint8Array([4, 5, 6]));
				expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
			}).pipe(Effect.provide(SHA256Test)),
		);
	});
});

describe("hash", () => {
	it.effect("hashes data with SHA256Service dependency", () =>
		Effect.gen(function* () {
			const data = new Uint8Array([104, 101, 108, 108, 111]);
			const result = yield* hash(data);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(SHA256Live)),
	);

	it.effect("works with test layer", () =>
		Effect.gen(function* () {
			const data = new Uint8Array([1, 2, 3]);
			const result = yield* hash(data);
			expect(result.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(SHA256Test)),
	);

	it("matches service result", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const [hashResult, serviceResult] = await Promise.all([
			Effect.runPromise(hash(data).pipe(Effect.provide(SHA256Live))),
			Effect.runPromise(
				Effect.gen(function* () {
					const sha256 = yield* SHA256Service;
					return yield* sha256.hash(data);
				}).pipe(Effect.provide(SHA256Live)),
			),
		]);
		expect(bytesToHex(hashResult)).toBe(bytesToHex(serviceResult));
	});
});
