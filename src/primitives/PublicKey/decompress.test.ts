import { describe, expect, test } from "vitest";
import * as PublicKey from "./index.js";

describe("PublicKey.decompress", () => {
	test("decompresses generator point", () => {
		// Compressed generator point
		const compressed = new Uint8Array(33);
		compressed[0] = 0x02; // even y

		// x coordinate of generator
		const x =
			"79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";
		for (let i = 0; i < 32; i++) {
			compressed[i + 1] = Number.parseInt(x.slice(i * 2, i * 2 + 2), 16);
		}

		const decompressed = PublicKey.decompress(compressed);

		expect(decompressed.length).toBe(64);

		// Verify x coordinate
		const decompressedX = Array.from(decompressed.slice(0, 32))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		expect(decompressedX).toBe(x);

		// Verify y coordinate (should be even)
		const y = decompressed[63];
		expect(y & 1).toBe(0); // even
	});

	test("handles odd y coordinate", () => {
		// Compressed point with odd y
		const compressed = new Uint8Array(33);
		compressed[0] = 0x03; // odd y

		// x coordinate
		const x =
			"c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5";
		for (let i = 0; i < 32; i++) {
			compressed[i + 1] = Number.parseInt(x.slice(i * 2, i * 2 + 2), 16);
		}

		const decompressed = PublicKey.decompress(compressed);

		expect(decompressed.length).toBe(64);

		// Verify y coordinate is odd
		const y = decompressed[63];
		expect(y & 1).toBe(1); // odd
	});

	test("round trip compress/decompress", () => {
		const original =
			"0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8";

		const originalBytes = PublicKey.from(original);
		const compressed = PublicKey.compress(originalBytes);
		const decompressed = PublicKey.decompress(compressed);

		expect(decompressed).toEqual(originalBytes);
	});

	test("throws on invalid prefix", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x04; // invalid prefix

		expect(() => PublicKey.decompress(compressed)).toThrow(
			/Invalid compressed public key prefix/,
		);
	});

	test("throws on invalid length", () => {
		const compressed = new Uint8Array(32); // too short

		expect(() => PublicKey.decompress(compressed)).toThrow(
			/Invalid compressed public key length/,
		);
	});

	test("throws on x >= p", () => {
		const compressed = new Uint8Array(33);
		compressed[0] = 0x02;
		// Set x to all 0xFF (> p)
		compressed.fill(0xff, 1);

		expect(() => PublicKey.decompress(compressed)).toThrow(
			/Invalid x-coordinate/,
		);
	});

	test("cross-validates with @noble/secp256k1", async () => {
		const secp256k1 = await import("@noble/secp256k1");

		// Use a deterministic test private key
		const privKey = new Uint8Array(32);
		privKey[31] = 42; // Use 42 as test private key

		// Get public key from noble
		const nobleUncompressed = secp256k1.getPublicKey(privKey, false); // 65 bytes with 0x04 prefix
		const nobleCompressed = secp256k1.getPublicKey(privKey, true); // 33 bytes

		// Convert noble's uncompressed (65 bytes with prefix) to our format (64 bytes)
		const ourUncompressed = nobleUncompressed.slice(1);

		// Test compress
		const ourCompressed = PublicKey.compress(ourUncompressed);
		expect(ourCompressed).toEqual(nobleCompressed);

		// Test decompress
		const ourDecompressed = PublicKey.decompress(ourCompressed);
		expect(ourDecompressed).toEqual(ourUncompressed);
	});

	test("handles multiple known test vectors", () => {
		const testVectors = [
			{
				// Generator point - prefix 02, even y
				prefix: 0x02,
				x: "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
				yEven: true,
			},
			{
				// Another test point - prefix 02, even y
				prefix: 0x02,
				x: "c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5",
				yEven: true,
			},
		];

		for (const { prefix, x, yEven } of testVectors) {
			// Build compressed bytes
			const compressedBytes = new Uint8Array(33);
			compressedBytes[0] = prefix;
			for (let i = 0; i < 32; i++) {
				compressedBytes[i + 1] = Number.parseInt(x.slice(i * 2, i * 2 + 2), 16);
			}

			const decompressed = PublicKey.decompress(compressedBytes);

			// Verify x coordinate
			const decompressedX = Array.from(decompressed.slice(0, 32))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			expect(decompressedX).toBe(x);

			// Verify y parity matches prefix
			const y = decompressed[63];
			const yIsEven = (y & 1) === 0;
			expect(yIsEven).toBe(yEven);
		}
	});
});
