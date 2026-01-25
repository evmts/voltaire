import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as PrivateKey from "./index.js";

const validHex = `0x${"ab".repeat(32)}`;
const validHexNoPrefix = "ab".repeat(32);

describe("PrivateKey.Hex", () => {
	describe("decode", () => {
		it("parses 64-char hex with prefix", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHex);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(32);
		});

		it("parses 64-char hex without prefix", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHexNoPrefix);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(32);
		});

		it("parses uppercase hex", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHex.toUpperCase());
			expect(pk.length).toBe(32);
		});

		it("parses mixed case hex", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(`0x${"Ab".repeat(32)}`);
			expect(pk.length).toBe(32);
		});

		it("fails on wrong length (too short)", () => {
			expect(() => S.decodeSync(PrivateKey.Hex)("0x1234")).toThrow();
		});

		it("fails on wrong length (too long)", () => {
			expect(() =>
				S.decodeSync(PrivateKey.Hex)(`0x${"ab".repeat(33)}`),
			).toThrow();
		});

		it("fails on odd length hex", () => {
			expect(() =>
				S.decodeSync(PrivateKey.Hex)(`0x${"ab".repeat(31)}a`),
			).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() =>
				S.decodeSync(PrivateKey.Hex)(`0x${"gg".repeat(32)}`),
			).toThrow();
		});

		it("fails on empty string", () => {
			expect(() => S.decodeSync(PrivateKey.Hex)("")).toThrow();
		});

		it("fails on just prefix", () => {
			expect(() => S.decodeSync(PrivateKey.Hex)("0x")).toThrow();
		});

		it("fails on whitespace", () => {
			expect(() => S.decodeSync(PrivateKey.Hex)("  ")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex with prefix", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHex);
			const hex = S.encodeSync(PrivateKey.Hex)(pk);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(66);
			expect(hex).toBe(hex.toLowerCase());
		});

		it("round-trips correctly", () => {
			const original = S.decodeSync(PrivateKey.Hex)(validHex);
			const encoded = S.encodeSync(PrivateKey.Hex)(original);
			const decoded = S.decodeSync(PrivateKey.Hex)(encoded);
			expect(decoded.length).toBe(original.length);
			expect([...decoded]).toEqual([...original]);
		});
	});
});

describe("PrivateKey.Bytes", () => {
	describe("decode", () => {
		it("parses 32-byte array", () => {
			const bytes = new Uint8Array(32).fill(0xab);
			const pk = S.decodeSync(PrivateKey.Bytes)(bytes);
			expect(pk.length).toBe(32);
		});

		it("fails on 31 bytes", () => {
			const bytes = new Uint8Array(31);
			expect(() => S.decodeSync(PrivateKey.Bytes)(bytes)).toThrow();
		});

		it("fails on 33 bytes", () => {
			const bytes = new Uint8Array(33);
			expect(() => S.decodeSync(PrivateKey.Bytes)(bytes)).toThrow();
		});

		it("fails on empty array", () => {
			expect(() => S.decodeSync(PrivateKey.Bytes)(new Uint8Array())).toThrow();
		});

		it("fails on 64 bytes", () => {
			const bytes = new Uint8Array(64);
			expect(() => S.decodeSync(PrivateKey.Bytes)(bytes)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to 32-byte Uint8Array", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHex);
			const bytes = S.encodeSync(PrivateKey.Bytes)(pk);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(32);
		});

		it("preserves byte values", () => {
			const pk = S.decodeSync(PrivateKey.Hex)(validHex);
			const bytes = S.encodeSync(PrivateKey.Bytes)(pk);
			expect(bytes[0]).toBe(0xab);
			expect(bytes[31]).toBe(0xab);
		});
	});
});

describe("effect-wrapped functions", () => {
	describe("isValid", () => {
		it("returns true for valid hex with prefix", async () => {
			const result = await Effect.runPromise(PrivateKey.isValid(validHex));
			expect(result).toBe(true);
		});

		it("returns true for valid hex without prefix", async () => {
			const result = await Effect.runPromise(
				PrivateKey.isValid(validHexNoPrefix),
			);
			expect(result).toBe(true);
		});

		it("returns true for valid 32-byte array", async () => {
			const bytes = new Uint8Array(32).fill(0x01);
			const result = await Effect.runPromise(PrivateKey.isValid(bytes));
			expect(result).toBe(true);
		});

		it("returns false for wrong hex length", async () => {
			const result = await Effect.runPromise(PrivateKey.isValid("0x1234"));
			expect(result).toBe(false);
		});

		it("returns false for wrong byte length", async () => {
			const bytes = new Uint8Array(31);
			const result = await Effect.runPromise(PrivateKey.isValid(bytes));
			expect(result).toBe(false);
		});

		it("returns false for invalid hex chars", async () => {
			const result = await Effect.runPromise(
				PrivateKey.isValid(`0x${"gg".repeat(32)}`),
			);
			expect(result).toBe(false);
		});

		it("returns false for empty string", async () => {
			const result = await Effect.runPromise(PrivateKey.isValid(""));
			expect(result).toBe(false);
		});

		it("returns false for empty array", async () => {
			const result = await Effect.runPromise(
				PrivateKey.isValid(new Uint8Array()),
			);
			expect(result).toBe(false);
		});
	});

	describe("random", () => {
		it("generates 32-byte private key", async () => {
			const pk = await Effect.runPromise(PrivateKey.random());
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(32);
		});

		it("generates different keys each time", async () => {
			const pk1 = await Effect.runPromise(PrivateKey.random());
			const pk2 = await Effect.runPromise(PrivateKey.random());
			expect([...pk1]).not.toEqual([...pk2]);
		});

		it("generates valid private key", async () => {
			const pk = await Effect.runPromise(PrivateKey.random());
			const isValid = await Effect.runPromise(PrivateKey.isValid(pk));
			expect(isValid).toBe(true);
		});

		it("can be encoded to hex", async () => {
			const pk = await Effect.runPromise(PrivateKey.random());
			const hex = S.encodeSync(PrivateKey.Hex)(pk);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(66);
		});

		it("generates multiple unique keys", async () => {
			const keys = await Promise.all(
				Array.from({ length: 5 }, () => Effect.runPromise(PrivateKey.random())),
			);
			const hexKeys = keys.map((k) => S.encodeSync(PrivateKey.Hex)(k));
			const uniqueKeys = new Set(hexKeys);
			expect(uniqueKeys.size).toBe(5);
		});
	});
});

describe("edge cases", () => {
	it("handles all-zeros private key", () => {
		const zeroBytes = new Uint8Array(32);
		const pk = S.decodeSync(PrivateKey.Bytes)(zeroBytes);
		expect(pk.length).toBe(32);
	});

	it("handles all-ones private key", () => {
		const oneBytes = new Uint8Array(32).fill(0x01);
		const pk = S.decodeSync(PrivateKey.Bytes)(oneBytes);
		expect(pk.length).toBe(32);
	});

	it("handles max value bytes", () => {
		const maxBytes = new Uint8Array(32).fill(0xff);
		const pk = S.decodeSync(PrivateKey.Bytes)(maxBytes);
		expect(pk.length).toBe(32);
	});

	it("handles known test vector", () => {
		const knownKey =
			"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
		const pk = S.decodeSync(PrivateKey.Hex)(knownKey);
		expect(pk.length).toBe(32);
		expect(pk[0]).toBe(0x01);
		expect(pk[1]).toBe(0x23);
	});

	it("handles minimum value key", () => {
		const minKey = `0x${"00".repeat(31)}01`;
		const pk = S.decodeSync(PrivateKey.Hex)(minKey);
		expect(pk.length).toBe(32);
		expect(pk[31]).toBe(0x01);
	});

	it("preserves exact byte values through round-trip", () => {
		const bytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) bytes[i] = i;
		const pk = S.decodeSync(PrivateKey.Bytes)(bytes);
		const encoded = S.encodeSync(PrivateKey.Bytes)(pk);
		expect([...encoded]).toEqual([...bytes]);
	});
});
