import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
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
		it("hashes data using Voltaire SHA256", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(SHA256Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("produces correct hash for known input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(SHA256Live)),
			);

			expect(result[0]).toBe(0xe3);
			expect(result[1]).toBe(0xb0);
		});
	});

	describe("Known Vector Tests (NIST FIPS 180-4)", () => {
		it("matches known vector: empty string", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(0));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
			);
		});

		it('matches known vector: "abc"', async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new TextEncoder().encode("abc"));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
			);
		});

		it('matches known vector: "hello"', async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new TextEncoder().encode("hello"));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
			);
		});

		it('matches known vector: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"', async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(
					new TextEncoder().encode(
						"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
					),
				);
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
			);
		});

		it('matches known vector: "The quick brown fox jumps over the lazy dog"', async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(
					new TextEncoder().encode(
						"The quick brown fox jumps over the lazy dog",
					),
				);
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
			);
		});

		it("matches known vector: single zero byte", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([0x00]));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0x6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d",
			);
		});

		it("matches known vector: 0xff byte", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([0xff]));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(bytesToHex(result)).toBe(
				"0xa8100ae6aa1940d0b663bb31cd466142ebbdbd5187131b92d93818987832eb89",
			);
		});
	});

	describe("Input size variations", () => {
		it("hashes empty input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(0));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes single byte", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([0x42]));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 55 bytes (single block without padding overflow)", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(55).fill(0x11));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 56 bytes (padding overflow boundary)", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(56).fill(0x22));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 64 bytes (block size)", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(64).fill(0x33));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 1KB input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(1024).fill(0x44));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 64KB input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(65536).fill(0x55));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});

		it("hashes 1MB input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array(1024 * 1024).fill(0x66));
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
		});
	});

	describe("Determinism", () => {
		it("produces same hash for same input", async () => {
			const input = new Uint8Array([1, 2, 3, 4, 5]);
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(input);
				const hash2 = yield* sha256.hash(input);
				return { hash1, hash2 };
			}).pipe(Effect.provide(SHA256Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});

		it("produces different hash for different input", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* sha256.hash(new Uint8Array([1, 2, 4]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(SHA256Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
		});

		it("is sensitive to single bit change", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([0b00000000]));
				const hash2 = yield* sha256.hash(new Uint8Array([0b00000001]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(SHA256Live));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
		});
	});

	describe("Double SHA256 (Bitcoin-style)", () => {
		it("computes double SHA256", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const first = yield* sha256.hash(new TextEncoder().encode("hello"));
				return yield* sha256.hash(first);
			}).pipe(Effect.provide(SHA256Live));

			const result = await Effect.runPromise(program);
			expect(result.length).toBe(32);
			expect(bytesToHex(result)).toBe(
				"0x9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50",
			);
		});
	});

	describe("SHA256Test", () => {
		it("returns deterministic zero-filled hash", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				return yield* sha256.hash(new Uint8Array([1, 2, 3]));
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(SHA256Test)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("returns same result for different inputs", async () => {
			const program = Effect.gen(function* () {
				const sha256 = yield* SHA256Service;
				const hash1 = yield* sha256.hash(new Uint8Array([1, 2, 3]));
				const hash2 = yield* sha256.hash(new Uint8Array([4, 5, 6]));
				return { hash1, hash2 };
			}).pipe(Effect.provide(SHA256Test));

			const { hash1, hash2 } = await Effect.runPromise(program);
			expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
		});
	});
});

describe("hash", () => {
	it("hashes data with SHA256Service dependency", async () => {
		const data = new Uint8Array([104, 101, 108, 108, 111]);
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(SHA256Live)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("works with test layer", async () => {
		const data = new Uint8Array([1, 2, 3]);
		const result = await Effect.runPromise(
			hash(data).pipe(Effect.provide(SHA256Test)),
		);

		expect(result.every((b) => b === 0)).toBe(true);
	});

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
