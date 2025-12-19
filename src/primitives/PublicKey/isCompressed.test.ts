import { describe, expect, test } from "vitest";
import * as PublicKey from "./index.js";

describe("PublicKey.isCompressed", () => {
	test("returns true for compressed with 0x02 prefix", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x02;

		expect(PublicKey.isCompressed(compressed)).toBe(true);
	});

	test("returns true for compressed with 0x03 prefix", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x03;

		expect(PublicKey.isCompressed(compressed)).toBe(true);
	});

	test("returns false for uncompressed 64 bytes", () => {
		const uncompressed = new Uint8Array(64);

		expect(PublicKey.isCompressed(uncompressed)).toBe(false);
	});

	test("returns false for invalid prefix", () => {
		const invalid = new Uint8Array(33);
		invalid[0] = 0x04; // invalid prefix

		expect(PublicKey.isCompressed(invalid)).toBe(false);
	});

	test("returns false for wrong length", () => {
		const invalid = new Uint8Array(32);

		expect(PublicKey.isCompressed(invalid)).toBe(false);
	});

	test("detects compressed keys from compress()", () => {
		const uncompressed =
			"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";

		const compressed = PublicKey.compress(uncompressed);

		expect(PublicKey.isCompressed(compressed)).toBe(true);
	});

	test("detects uncompressed keys from decompress()", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x02;

		// Generator x
		const x =
			"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
		for (let i = 0; i < 32; i++) {
			compressed[i + 1] = Number.parseInt(x.slice(i * 2, i * 2 + 2), 16);
		}

		const uncompressed = PublicKey.decompress(compressed);

		expect(PublicKey.isCompressed(uncompressed)).toBe(false);
	});

	test("checks various edge cases", () => {
		// Empty array
		expect(PublicKey.isCompressed(new Uint8Array(0))).toBe(false);

		// 65 bytes (uncompressed with prefix)
		const withPrefix = new Uint8Array(65);
		withPrefix[0] = 0x04;
		expect(PublicKey.isCompressed(withPrefix)).toBe(false);

		// 33 bytes but wrong prefix
		const wrongPrefix = new Uint8Array(33);
		wrongPrefix[0] = 0x00;
		expect(PublicKey.isCompressed(wrongPrefix)).toBe(false);

		wrongPrefix[0] = 0x01;
		expect(PublicKey.isCompressed(wrongPrefix)).toBe(false);

		wrongPrefix[0] = 0xff;
		expect(PublicKey.isCompressed(wrongPrefix)).toBe(false);
	});
});
