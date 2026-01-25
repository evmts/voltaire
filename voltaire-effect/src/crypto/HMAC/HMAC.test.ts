import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import {
	HMACLive,
	HMACService,
	HMACTest,
	hmacSha256,
	hmacSha512,
} from "./index.js";

describe("HMACService", () => {
	const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
	const message = new Uint8Array([104, 101, 108, 108, 111]); // "hello"

	describe("HMACLive", () => {
		it("computes HMAC-SHA256", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				return yield* hmac.sha256(key, message);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HMACLive)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("computes HMAC-SHA512", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				return yield* hmac.sha512(key, message);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HMACLive)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("produces different outputs for different keys", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(
					new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2]),
					message,
				);
				return { mac1, mac2 };
			});

			const { mac1, mac2 } = await Effect.runPromise(
				program.pipe(Effect.provide(HMACLive)),
			);

			expect(Buffer.from(mac1).toString("hex")).not.toBe(
				Buffer.from(mac2).toString("hex"),
			);
		});

		it("produces different outputs for different messages", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(
					key,
					new Uint8Array([119, 111, 114, 108, 100]),
				); // "world"
				return { mac1, mac2 };
			});

			const { mac1, mac2 } = await Effect.runPromise(
				program.pipe(Effect.provide(HMACLive)),
			);

			expect(Buffer.from(mac1).toString("hex")).not.toBe(
				Buffer.from(mac2).toString("hex"),
			);
		});

		it("produces consistent output for same input", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				const mac1 = yield* hmac.sha256(key, message);
				const mac2 = yield* hmac.sha256(key, message);
				return { mac1, mac2 };
			});

			const { mac1, mac2 } = await Effect.runPromise(
				program.pipe(Effect.provide(HMACLive)),
			);

			expect(Buffer.from(mac1).toString("hex")).toBe(
				Buffer.from(mac2).toString("hex"),
			);
		});
	});

	describe("HMACTest", () => {
		it("returns zero-filled 32-byte array for sha256", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				return yield* hmac.sha256(key, message);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HMACTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("returns zero-filled 64-byte array for sha512", async () => {
			const program = Effect.gen(function* () {
				const hmac = yield* HMACService;
				return yield* hmac.sha512(key, message);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(HMACTest)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
			expect(result.every((b) => b === 0)).toBe(true);
		});
	});
});

describe("convenience functions", () => {
	const key = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
	const message = new Uint8Array([104, 101, 108, 108, 111]);

	it("hmacSha256 works with service dependency", async () => {
		const result = await Effect.runPromise(
			hmacSha256(key, message).pipe(Effect.provide(HMACLive)),
		);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("hmacSha512 works with service dependency", async () => {
		const result = await Effect.runPromise(
			hmacSha512(key, message).pipe(Effect.provide(HMACLive)),
		);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});
});
