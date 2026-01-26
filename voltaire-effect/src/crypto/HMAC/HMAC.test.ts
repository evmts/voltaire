import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	HMACLive,
	HMACService,
	HMACTest,
	hmacSha256,
	hmacSha512,
} from "./index.js";

const bytesToHex = (bytes: Uint8Array): string => {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

describe("HMACService", () => {
	const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
	const message = new Uint8Array([104, 101, 108, 108, 111]);

	describe("HMACLive", () => {
		it.effect("computes HMAC-SHA256", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, message);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("computes HMAC-SHA512", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha512(key, message);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("produces different outputs for different keys", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(
					new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2]),
					message,
				);
				expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("produces different outputs for different messages", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(
					key,
					new Uint8Array([119, 111, 114, 108, 100]),
				);
				expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("produces consistent output for same input", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(key, message);
				expect(bytesToHex(mac1)).toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);
	});

	describe("Known Vector Tests (RFC 4231)", () => {
		it.effect("HMAC-SHA256: Test Case 1 - short key and data", () =>
			Effect.gen(function* () {
				const testKey = new Uint8Array(20).fill(0x0b);
				const testData = new TextEncoder().encode("Hi There");
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(testKey, testData);
				expect(bytesToHex(result)).toBe(
					"0xb0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
				);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("HMAC-SHA256: Test Case 2 - key = Jefe", () =>
			Effect.gen(function* () {
				const testKey = new TextEncoder().encode("Jefe");
				const testData = new TextEncoder().encode("what do ya want for nothing?");
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(testKey, testData);
				expect(bytesToHex(result)).toBe(
					"0x5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
				);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("HMAC-SHA512: Test Case 1 - short key and data", () =>
			Effect.gen(function* () {
				const testKey = new Uint8Array(20).fill(0x0b);
				const testData = new TextEncoder().encode("Hi There");
				const hmac = yield* HMACService;
				const result = yield* hmac.sha512(testKey, testData);
				expect(bytesToHex(result)).toBe(
					"0x87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854",
				);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("HMAC-SHA512: Test Case 2 - key = Jefe", () =>
			Effect.gen(function* () {
				const testKey = new TextEncoder().encode("Jefe");
				const testData = new TextEncoder().encode("what do ya want for nothing?");
				const hmac = yield* HMACService;
				const result = yield* hmac.sha512(testKey, testData);
				expect(bytesToHex(result)).toBe(
					"0x164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737",
				);
			}).pipe(Effect.provide(HMACLive))
		);
	});

	describe("Key size variations", () => {
		it.effect("handles empty key", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array(0), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles single-byte key", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array([0x42]), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 32-byte key (block size for SHA256)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array(32).fill(0xaa), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 64-byte key (block size for SHA256 internal)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array(64).fill(0xbb), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 128-byte key (longer than block size)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array(128).fill(0xcc), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 256-byte key", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(new Uint8Array(256).fill(0xdd), message);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("SHA512 handles 128-byte key (block size for SHA512 internal)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha512(new Uint8Array(128).fill(0xee), message);
				expect(result.length).toBe(64);
			}).pipe(Effect.provide(HMACLive))
		);
	});

	describe("Message size variations", () => {
		it.effect("handles empty message", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, new Uint8Array(0));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles single-byte message", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, new Uint8Array([0x42]));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 1KB message", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, new Uint8Array(1024).fill(0x11));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("handles 64KB message", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, new Uint8Array(65536).fill(0x22));
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(HMACLive))
		);
	});

	describe("Determinism", () => {
		it.effect("produces same result for same inputs (SHA256)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(key, message);
				expect(bytesToHex(mac1)).toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("produces same result for same inputs (SHA512)", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha512(key, message);
				const mac2 = yield* hmac.sha512(key, message);
				expect(bytesToHex(mac1)).toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("is sensitive to single bit change in key", () =>
			Effect.gen(function* () {
				const key1 = new Uint8Array([0b00000000, 0x02, 0x03]);
				const key2 = new Uint8Array([0b00000001, 0x02, 0x03]);
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key1, message);
				const mac2 = yield* hmac.sha256(key2, message);
				expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);

		it.effect("is sensitive to single bit change in message", () =>
			Effect.gen(function* () {
				const msg1 = new Uint8Array([0b00000000, 0x02, 0x03]);
				const msg2 = new Uint8Array([0b00000001, 0x02, 0x03]);
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, msg1);
				const mac2 = yield* hmac.sha256(key, msg2);
				expect(bytesToHex(mac1)).not.toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACLive))
		);
	});

	describe("HMACTest", () => {
		it.effect("returns zero-filled 32-byte array for sha256", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha256(key, message);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
				expect(result.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(HMACTest))
		);

		it.effect("returns zero-filled 64-byte array for sha512", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const result = yield* hmac.sha512(key, message);
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(64);
				expect(result.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(HMACTest))
		);

		it.effect("returns same result for different keys", () =>
			Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(new Uint8Array([9, 8, 7, 6]), message);
				expect(bytesToHex(mac1)).toBe(bytesToHex(mac2));
			}).pipe(Effect.provide(HMACTest))
		);
	});
});

describe("convenience functions", () => {
	const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
	const message = new Uint8Array([104, 101, 108, 108, 111]);

	it.effect("hmacSha256 works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* hmacSha256(key, message);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(HMACLive))
	);

	it.effect("hmacSha512 works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* hmacSha512(key, message);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		}).pipe(Effect.provide(HMACLive))
	);

	it("hmacSha256 matches service result", async () => {
		const [funcResult, serviceResult] = await Promise.all([
			Effect.runPromise(hmacSha256(key, message).pipe(Effect.provide(HMACLive))),
			Effect.runPromise(
				Effect.gen(function* () {
					const hmac = yield* HMACService;
					return yield* hmac.sha256(key, message);
				}).pipe(Effect.provide(HMACLive)),
			),
		]);
		expect(bytesToHex(funcResult)).toBe(bytesToHex(serviceResult));
	});

	it("hmacSha512 matches service result", async () => {
		const [funcResult, serviceResult] = await Promise.all([
			Effect.runPromise(hmacSha512(key, message).pipe(Effect.provide(HMACLive))),
			Effect.runPromise(
				Effect.gen(function* () {
					const hmac = yield* HMACService;
					return yield* hmac.sha512(key, message);
				}).pipe(Effect.provide(HMACLive)),
			),
		]);
		expect(bytesToHex(funcResult)).toBe(bytesToHex(serviceResult));
	});

	it.effect("hmacSha256 works with test layer", () =>
		Effect.gen(function* () {
			const result = yield* hmacSha256(key, message);
			expect(result.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HMACTest))
	);

	it.effect("hmacSha512 works with test layer", () =>
		Effect.gen(function* () {
			const result = yield* hmacSha512(key, message);
			expect(result.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(HMACTest))
	);
});
