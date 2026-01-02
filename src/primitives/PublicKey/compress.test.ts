import { describe, expect, test } from "vitest";
import * as PublicKey from "./index.js";

describe("PublicKey.compress", () => {
	test("compresses known public key", () => {
		// Known test vector - generator point
		const uncompressed =
			"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";

		const compressed = PublicKey.compress(uncompressed);

		expect(compressed.length).toBe(33);
		// y coordinate ends in ...b8, which is even, so prefix should be 0x02
		expect(compressed[0]).toBe(0x02);

		// x coordinate should match
		const expectedX =
			"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
		const actualX = Array.from(compressed.slice(1))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		expect(actualX).toBe(expectedX);
	});

	test("handles odd y coordinate", () => {
		// Create a key with odd y
		// Private key 2 generates: x=c6047f..., y=5cbdf0... (odd)
		const uncompressed =
			"0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee55cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bffcf34e7e91c";

		const compressed = PublicKey.compress(uncompressed);

		expect(compressed.length).toBe(33);
		// y ends in ...1c, which is even, so prefix should be 0x02
		expect(compressed[0]).toBe(0x02);
	});

	test("accepts Uint8Array input", () => {
		const bytes = new Uint8Array(64);
		// Set some test values
		bytes[0] = 0x79;
		bytes[32] = 0x48; // even y

		const compressed = PublicKey.compress(bytes);

		expect(compressed.length).toBe(33);
		expect(compressed[0]).toBe(0x02);
		expect(compressed[1]).toBe(0x79);
	});

	test("round trip with decompress", () => {
		const original =
			"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";

		const compressed = PublicKey.compress(original);
		const decompressed = PublicKey.decompress(compressed);

		// Should match original (without 0x prefix)
		const originalBytes = PublicKey.from(original);
		expect(decompressed).toEqual(originalBytes);
	});

	test("compresses multiple keys correctly", () => {
		// Test vectors with different y parities
		const keys = [
			{
				uncompressed:
					"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
				expectedPrefix: 0x02, // y is even
			},
			{
				uncompressed:
					"0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee55cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bffcf34e7e91c",
				expectedPrefix: 0x02, // y is even
			},
		];

		for (const { uncompressed, expectedPrefix } of keys) {
			const compressed = PublicKey.compress(uncompressed);
			expect(compressed[0]).toBe(expectedPrefix);
		}
	});

	test("accepts 65-byte SEC1 uncompressed format with 0x04 prefix", () => {
		// SEC1 format: 0x04 || x || y (65 bytes)
		const sec1Key = new Uint8Array(65);
		sec1Key[0] = 0x04; // SEC1 uncompressed prefix
		// x coordinate starts at byte 1
		sec1Key[1] = 0x79;
		// y coordinate starts at byte 33, make it even
		sec1Key[33] = 0x48;

		const compressed = PublicKey.compress(sec1Key);

		expect(compressed.length).toBe(33);
		expect(compressed[0]).toBe(0x02); // even y
		expect(compressed[1]).toBe(0x79);
	});

	test("throws for invalid length", () => {
		const shortKey = new Uint8Array(32);
		expect(() => PublicKey.compress(shortKey)).toThrow(
			"Invalid public key length: expected 64 or 65 bytes, got 32",
		);

		const longKey = new Uint8Array(70);
		expect(() => PublicKey.compress(longKey)).toThrow(
			"Invalid public key length: expected 64 or 65 bytes, got 70",
		);
	});

	test("throws for 65-byte key without 0x04 prefix", () => {
		const badPrefix = new Uint8Array(65);
		badPrefix[0] = 0x02; // compressed prefix instead of 0x04

		expect(() => PublicKey.compress(badPrefix)).toThrow(
			"Invalid uncompressed public key prefix: expected 0x04, got 0x02",
		);
	});

	test("throws for 65-byte key with 0x03 prefix", () => {
		const badPrefix = new Uint8Array(65);
		badPrefix[0] = 0x03;

		expect(() => PublicKey.compress(badPrefix)).toThrow(
			"Invalid uncompressed public key prefix: expected 0x04, got 0x03",
		);
	});
});
