import { x25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { InvalidPublicKeyError } from "./errors.js";
import { X25519 } from "./index.js";

const hex = (s: string): Uint8Array => {
	const out = new Uint8Array(s.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
};

/**
 * Small-order encodings from https://cr.yp.to/ecdh.html#validate (the same
 * set libsodium blocklists). u is little-endian.
 */
const LOW_ORDER: [string, string][] = [
	[
		"u = 0 (order 2)",
		"0000000000000000000000000000000000000000000000000000000000000000",
	],
	[
		"u = 1 (order 4)",
		"0100000000000000000000000000000000000000000000000000000000000000",
	],
	[
		"order 8 (a)",
		"e0eb7a7c3b41b8ae1656e3faf19fc46ada098deb9c32b1fd866205165f49b800",
	],
	[
		"order 8 (b)",
		"5f9c95bca3508c24b1d0b1559c83ef5b04445cc4581c8e86d8224eddd09f1157",
	],
	[
		"u = p - 1 (order 4, twist)",
		"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
	[
		"u = p (non-canonical 0)",
		"edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
	[
		"u = p + 1 (non-canonical 1)",
		"eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
];

/** The same seven points with the ignored bit 255 set. */
const withHighBit = (bytes: Uint8Array): Uint8Array => {
	const out = bytes.slice();
	out[31] = (out[31] as number) | 0x80;
	return out;
};

const secretKeys = [
	new Uint8Array(32).fill(1),
	new Uint8Array(32).fill(0xff),
	hex("77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a"),
	crypto.getRandomValues(new Uint8Array(32)),
];

describe("X25519 weak public keys (issue #86)", () => {
	describe("the known low-order points", () => {
		for (const [name, encoded] of LOW_ORDER) {
			for (const [suffix, key] of [
				["", hex(encoded)],
				[" with bit 255 set", withHighBit(hex(encoded))],
			] as const) {
				it(`flags ${name}${suffix}`, () => {
					expect(X25519.isWeakPublicKey(key)).toBe(true);
					expect(X25519.validatePublicKey(key)).toBe(false);
					expect(X25519.isValidPublicKey(key)).toBe(false);
				});

				it(`scalarmult rejects ${name}${suffix}`, () => {
					for (const secretKey of secretKeys) {
						expect(() => X25519.scalarmult(secretKey, key)).toThrow(
							InvalidPublicKeyError,
						);
					}
				});

				it(`${name}${suffix} really yields an all-zero secret`, () => {
					// Independent confirmation that the vector is low-order: the
					// underlying ladder refuses it because its output is zero.
					for (const secretKey of secretKeys) {
						expect(() => x25519.getSharedSecret(secretKey, key)).toThrow();
					}
				});
			}
		}

		it("covers 14 distinct encodings", () => {
			const all = new Set<string>();
			for (const [, encoded] of LOW_ORDER) {
				all.add(encoded);
				all.add(
					Array.from(withHighBit(hex(encoded)), (b) =>
						b.toString(16).padStart(2, "0"),
					).join(""),
				);
			}
			expect(all.size).toBe(14);
		});
	});

	describe("keys that must stay valid", () => {
		it("accepts the base point u = 9", () => {
			const base = new Uint8Array(32);
			base[0] = 9;
			expect(X25519.isWeakPublicKey(base)).toBe(false);
			expect(X25519.validatePublicKey(base)).toBe(true);
			expect(X25519.isValidPublicKey(base)).toBe(true);
		});

		it("accepts u = 2 and neighbours of the low-order values", () => {
			for (const encoded of [
				"0200000000000000000000000000000000000000000000000000000000000000",
				"e1eb7a7c3b41b8ae1656e3faf19fc46ada098deb9c32b1fd866205165f49b800",
				"5e9c95bca3508c24b1d0b1559c83ef5b04445cc4581c8e86d8224eddd09f1157",
				"ebffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
			]) {
				expect(X25519.isWeakPublicKey(hex(encoded))).toBe(false);
				expect(X25519.validatePublicKey(hex(encoded))).toBe(true);
			}
		});

		it("accepts derived public keys", () => {
			for (let i = 0; i < 64; i++) {
				const publicKey = X25519.derivePublicKey(
					crypto.getRandomValues(new Uint8Array(32)),
				);
				expect(X25519.isWeakPublicKey(publicKey)).toBe(false);
				expect(X25519.validatePublicKey(publicKey)).toBe(true);
			}
		});

		it("accepts non-canonical u = p + 2 and reduces it (RFC 7748 section 5)", () => {
			const nonCanonical = hex(
				"efffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
			);
			const canonical = new Uint8Array(32);
			canonical[0] = 2;
			expect(X25519.validatePublicKey(nonCanonical)).toBe(true);
			for (const secretKey of secretKeys) {
				expect(X25519.scalarmult(secretKey, nonCanonical)).toEqual(
					X25519.scalarmult(secretKey, canonical),
				);
			}
		});

		it("ignores bit 255 of a valid key (RFC 7748 section 5)", () => {
			const publicKey = X25519.derivePublicKey(new Uint8Array(32).fill(7));
			for (const secretKey of secretKeys) {
				expect(X25519.scalarmult(secretKey, withHighBit(publicKey))).toEqual(
					X25519.scalarmult(secretKey, publicKey),
				);
			}
		});
	});

	describe("length handling", () => {
		it("isWeakPublicKey is false and validatePublicKey is false for wrong lengths", () => {
			for (const length of [0, 1, 31, 33, 64]) {
				const key = new Uint8Array(length);
				expect(X25519.isWeakPublicKey(key)).toBe(false);
				expect(X25519.validatePublicKey(key)).toBe(false);
			}
		});

		it("rejects non-Uint8Array input", () => {
			// @ts-expect-error testing invalid input
			expect(X25519.validatePublicKey("00".repeat(32))).toBe(false);
			// @ts-expect-error testing invalid input
			expect(X25519.validatePublicKey(null)).toBe(false);
		});
	});

	describe("RFC 7748 section 6.1 test vector still passes", () => {
		it("derives the documented shared secret", () => {
			const alice = hex(
				"77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a",
			);
			const bobPublic = hex(
				"de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f",
			);
			expect(X25519.scalarmult(alice, bobPublic)).toEqual(
				hex("4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742"),
			);
		});
	});
});
