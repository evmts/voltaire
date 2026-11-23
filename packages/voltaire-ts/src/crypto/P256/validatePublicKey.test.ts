import { p256 } from "@noble/curves/nist.js";
import { describe, expect, it } from "vitest";
import { CURVE_B, FIELD_PRIME } from "./constants.js";
import { InvalidPublicKeyError } from "./errors.js";
import { P256 } from "./index.js";

const P = FIELD_PRIME;

const toBytes32 = (value: bigint): Uint8Array => {
	const out = new Uint8Array(32);
	let v = value;
	for (let i = 31; i >= 0; i--) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return out;
};

const raw = (x: bigint, y: bigint): Uint8Array => {
	const out = new Uint8Array(64);
	out.set(toBytes32(x), 0);
	out.set(toBytes32(y), 32);
	return out;
};

const withPrefix = (prefix: number, body: Uint8Array): Uint8Array => {
	const out = new Uint8Array(body.length + 1);
	out[0] = prefix;
	out.set(body, 1);
	return out;
};

const G = p256.Point.BASE.toAffine();
const privateKey = toBytes32(0x1234567890abcdefn);
const messageHash = new Uint8Array(32).fill(0xab);

/** Smallest x >= 1 that is the x-coordinate of a curve point. */
const smallPoint = (() => {
	for (let x = 1n; ; x++) {
		try {
			return p256.Point.fromBytes(withPrefix(0x02, toBytes32(x))).toAffine();
		} catch {
			// x^3 - 3x + b is not a square, try the next x
		}
	}
})();

/** Smallest x >= 1 for which x^3 - 3x + b is NOT a square mod p. */
const nonResidueX = (() => {
	for (let x = 1n; ; x++) {
		try {
			p256.Point.fromBytes(withPrefix(0x02, toBytes32(x)));
		} catch {
			return x;
		}
	}
})();

describe("P256 public key validation (issue #86)", () => {
	describe("valid keys", () => {
		it("accepts the generator in all three encodings", () => {
			const key = raw(G.x, G.y);
			expect(P256.validatePublicKey(key)).toBe(true);
			expect(P256.isValidPublicKey(key)).toBe(true);
			expect(P256.validatePublicKey(withPrefix(0x04, key))).toBe(true);
			const prefix = G.y & 1n ? 0x03 : 0x02;
			expect(P256.validatePublicKey(withPrefix(prefix, toBytes32(G.x)))).toBe(
				true,
			);
		});

		it("accepts both square roots of a compressed x", () => {
			const x = toBytes32(smallPoint.x);
			expect(P256.validatePublicKey(withPrefix(0x02, x))).toBe(true);
			expect(P256.validatePublicKey(withPrefix(0x03, x))).toBe(true);
			expect(P256.validatePublicKey(raw(smallPoint.x, smallPoint.y))).toBe(
				true,
			);
			expect(P256.validatePublicKey(raw(smallPoint.x, P - smallPoint.y))).toBe(
				true,
			);
		});

		it("accepts derived public keys", () => {
			for (let i = 1; i <= 32; i++) {
				const key = P256.derivePublicKey(
					toBytes32(BigInt(i) * 0x9e3779b97f4an),
				);
				expect(P256.validatePublicKey(key)).toBe(true);
			}
		});

		it("accepts the public key of the largest private key n - 1 (= -G)", () => {
			expect(P256.validatePublicKey(raw(G.x, P - G.y))).toBe(true);
			expect(P256.derivePublicKey(toBytes32(P256.CURVE_ORDER - 1n))).toEqual(
				raw(G.x, P - G.y),
			);
		});
	});

	describe("point at infinity", () => {
		it("rejects (0, 0)", () => {
			expect(P256.validatePublicKey(new Uint8Array(64))).toBe(false);
			expect(P256.isValidPublicKey(new Uint8Array(64))).toBe(false);
			expect(P256.validatePublicKey(withPrefix(0x04, new Uint8Array(64)))).toBe(
				false,
			);
		});

		it("rejects the SEC1 infinity encoding 0x00", () => {
			expect(P256.validatePublicKey(new Uint8Array([0x00]))).toBe(false);
		});

		it("rejects (0, 0) aliases built from p", () => {
			expect(P256.validatePublicKey(raw(P, P))).toBe(false);
			expect(P256.validatePublicKey(raw(0n, P))).toBe(false);
			expect(P256.validatePublicKey(raw(P, 0n))).toBe(false);
		});
	});

	describe("coordinates >= p", () => {
		it("rejects x = p and y = p", () => {
			expect(P256.validatePublicKey(raw(P, G.y))).toBe(false);
			expect(P256.validatePublicKey(raw(G.x, P))).toBe(false);
		});

		it("rejects x + p, a non-canonical alias of a valid point", () => {
			// (x + p, y) reduces to a real curve point; lax parsers accept it
			expect(smallPoint.x + P < 1n << 256n).toBe(true);
			expect(P256.validatePublicKey(raw(smallPoint.x, smallPoint.y))).toBe(
				true,
			);
			expect(P256.validatePublicKey(raw(smallPoint.x + P, smallPoint.y))).toBe(
				false,
			);
			expect(
				P256.validatePublicKey(
					withPrefix(0x04, raw(smallPoint.x + P, smallPoint.y)),
				),
			).toBe(false);
			expect(
				P256.validatePublicKey(withPrefix(0x02, toBytes32(smallPoint.x + P))),
			).toBe(false);
		});

		it("rejects all-0xff coordinates", () => {
			expect(P256.validatePublicKey(new Uint8Array(64).fill(0xff))).toBe(false);
		});
	});

	describe("points not on the curve", () => {
		it("rejects the generator with y off by one", () => {
			expect(P256.validatePublicKey(raw(G.x, G.y + 1n))).toBe(false);
			expect(P256.validatePublicKey(raw(G.x, G.y - 1n))).toBe(false);
			expect(P256.validatePublicKey(raw(G.x + 1n, G.y))).toBe(false);
		});

		it("rejects swapped coordinates", () => {
			expect(P256.validatePublicKey(raw(G.y, G.x))).toBe(false);
		});

		it("rejects an invalid-curve point (same a, different b)", () => {
			// (1, 1) lies on y^2 = x^3 - 3x + 3, not on P-256. Feeding such a
			// point to ECDH is the classic invalid-curve key-recovery attack.
			const x = 1n;
			const y = 1n;
			const otherB = (((y * y - x * x * x + 3n * x) % P) + P) % P;
			expect(otherB).not.toBe(CURVE_B);
			expect(P256.validatePublicKey(raw(x, y))).toBe(false);
		});

		it("rejects the secp256k1 generator", () => {
			const k1x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const k1y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			expect(P256.validatePublicKey(raw(k1x, k1y))).toBe(false);
		});

		it("rejects (0, y) and (x, 0) with one zero coordinate off-curve", () => {
			expect(P256.validatePublicKey(raw(0n, 1n))).toBe(false);
			expect(P256.validatePublicKey(raw(1n, 0n))).toBe(false);
		});

		it("rejects a compressed x with no square root", () => {
			const x = toBytes32(nonResidueX);
			expect(P256.validatePublicKey(withPrefix(0x02, x))).toBe(false);
			expect(P256.validatePublicKey(withPrefix(0x03, x))).toBe(false);
		});
	});

	describe("SEC1 prefix and length", () => {
		const key = raw(G.x, G.y);

		it("rejects wrong prefixes on 65-byte keys", () => {
			for (const prefix of [0x00, 0x01, 0x02, 0x03, 0x05, 0x06, 0x07, 0xff]) {
				expect(P256.validatePublicKey(withPrefix(prefix, key))).toBe(false);
			}
		});

		it("rejects wrong prefixes on 33-byte keys", () => {
			for (const prefix of [0x00, 0x01, 0x04, 0x05, 0x06, 0x07, 0xff]) {
				expect(P256.validatePublicKey(withPrefix(prefix, toBytes32(G.x)))).toBe(
					false,
				);
			}
		});

		it("rejects every other length", () => {
			for (const length of [0, 1, 31, 32, 34, 63, 66, 96, 128]) {
				expect(P256.validatePublicKey(new Uint8Array(length).fill(1))).toBe(
					false,
				);
			}
			expect(P256.validatePublicKey(key.slice(0, 63))).toBe(false);
		});

		it("rejects non-Uint8Array input", () => {
			// @ts-expect-error testing invalid input
			expect(P256.validatePublicKey("04abcd")).toBe(false);
			// @ts-expect-error testing invalid input
			expect(P256.validatePublicKey(null)).toBe(false);
			// @ts-expect-error testing invalid input
			expect(P256.validatePublicKey(Array.from(key))).toBe(false);
		});
	});

	describe("ECDH", () => {
		const attackKeys: [string, Uint8Array][] = [
			["point at infinity", new Uint8Array(64)],
			["off-curve point", raw(G.x, G.y + 1n)],
			["invalid-curve point", raw(1n, 1n)],
			["x = p", raw(P, G.y)],
			["y = p", raw(G.x, P)],
			["x + p alias", raw(smallPoint.x + P, smallPoint.y)],
			["all 0xff", new Uint8Array(64).fill(0xff)],
		];

		for (const [name, key] of attackKeys) {
			it(`throws InvalidPublicKeyError for ${name}`, () => {
				expect(() => P256.ecdh(privateKey, key)).toThrow(InvalidPublicKeyError);
			});
		}

		it("still rejects SEC1-prefixed keys by length", () => {
			expect(() =>
				P256.ecdh(privateKey, withPrefix(0x04, raw(G.x, G.y))),
			).toThrow(InvalidPublicKeyError);
		});

		it("still agrees on a shared secret for valid keys", () => {
			const other = toBytes32(0xfedcba9876543210n);
			const a = P256.ecdh(privateKey, P256.derivePublicKey(other));
			const b = P256.ecdh(other, P256.derivePublicKey(privateKey));
			expect(a).toEqual(b);
			expect(a.length).toBe(32);
		});
	});

	describe("verify", () => {
		const signature = P256.sign(messageHash, privateKey);

		it("returns false for invalid public keys instead of verifying", () => {
			expect(P256.verify(signature, messageHash, new Uint8Array(64))).toBe(
				false,
			);
			expect(P256.verify(signature, messageHash, raw(G.x, G.y + 1n))).toBe(
				false,
			);
			expect(P256.verify(signature, messageHash, raw(P, G.y))).toBe(false);
			const publicKey = P256.derivePublicKey(privateKey);
			const x = BigInt(
				`0x${Array.from(publicKey.slice(0, 32), (b) => b.toString(16).padStart(2, "0")).join("")}`,
			);
			// Only meaningful when x + p fits in 32 bytes; otherwise skip the alias
			if (x + P < 1n << 256n) {
				const aliased = publicKey.slice();
				aliased.set(toBytes32(x + P), 0);
				expect(P256.verify(signature, messageHash, aliased)).toBe(false);
			}
		});

		it("still verifies under the real public key", () => {
			expect(
				P256.verify(signature, messageHash, P256.derivePublicKey(privateKey)),
			).toBe(true);
		});
	});
});
