import { ed25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { Ed25519 } from "./index.js";

const hex = (s: string): Uint8Array => {
	const out = new Uint8Array(s.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
};

const P = (1n << 255n) - 19n;

const encodeY = (y: bigint, sign = 0): Uint8Array => {
	const out = new Uint8Array(32);
	let v = y;
	for (let i = 0; i < 32; i++) {
		out[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	out[31] = (out[31] as number) | (sign << 7);
	return out;
};

/** The 8 points of the torsion subgroup E[8], canonical encodings. */
const TORSION: [string, number, string][] = [
	[
		"identity (0, 1)",
		1,
		"0100000000000000000000000000000000000000000000000000000000000000",
	],
	[
		"(0, -1)",
		2,
		"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
	[
		"(sqrt(-1), 0)",
		4,
		"0000000000000000000000000000000000000000000000000000000000000000",
	],
	[
		"(-sqrt(-1), 0)",
		4,
		"0000000000000000000000000000000000000000000000000000000000000080",
	],
	[
		"order 8 (a)",
		8,
		"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05",
	],
	[
		"order 8 (b)",
		8,
		"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85",
	],
	[
		"order 8 (c)",
		8,
		"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a",
	],
	[
		"order 8 (d)",
		8,
		"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa",
	],
];

/** Non-canonical encodings that alias torsion points. */
const NON_CANONICAL_TORSION: [string, string][] = [
	[
		"identity with x sign bit set",
		"0100000000000000000000000000000000000000000000000000000000000080",
	],
	[
		"(0, -1) with x sign bit set",
		"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	],
	[
		"y = p (alias of y = 0)",
		"edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
	[
		"y = p with sign bit",
		"edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	],
	[
		"y = p + 1 (alias of identity)",
		"eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
	],
	[
		"y = p + 1 with sign bit",
		"eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
	],
];

/** RFC 8032 section 7.1 test vectors (secret, public, message, signature). */
const RFC8032 = [
	{
		name: "TEST 1",
		secret: "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
		public: "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
		message: "",
		signature:
			"e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
	},
	{
		name: "TEST 2",
		secret: "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb",
		public: "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
		message: "72",
		signature:
			"92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00",
	},
	{
		name: "TEST 3",
		secret: "c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7",
		public: "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025",
		message: "af82",
		signature:
			"6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a",
	},
	{
		name: "TEST SHA(abc)",
		secret: "833fe62409237b9d62ec77587520911e9a759cec1d19755b7da901b96dca3d42",
		public: "ec172b93ad5e563bf4932c70e1245034c35467ef2efd4d64ebf819683467e2bf",
		message:
			"ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
		signature:
			"dc2a4459e7369633a52b1bf277839a00201009a3efbf3ecb69bea2186c26b58909351fc9ac90b3ecfdfbc7c66431e0303dca179c138ac17ad9bef1177331a704",
	},
];

describe("Ed25519 public key validation (issue #86)", () => {
	describe("small-subgroup (torsion) points", () => {
		for (const [name, order, encoded] of TORSION) {
			it(`rejects ${name}, order ${order}`, () => {
				const key = hex(encoded);
				expect(Ed25519.validatePublicKey(key)).toBe(false);
				expect(Ed25519.isValidPublicKey(key)).toBe(false);
			});

			it(`${name} really has order ${order}`, () => {
				// Independent confirmation of the vector: it decodes to a curve
				// point whose exact order is the documented one.
				const point = ed25519.Point.fromBytes(hex(encoded), false);
				const { ZERO } = ed25519.Point;
				let acc = ZERO;
				let actual = 0;
				for (let i = 1; i <= 8; i++) {
					acc = acc.add(point);
					if (acc.equals(ZERO)) {
						actual = i;
						break;
					}
				}
				expect(actual).toBe(order);
			});
		}

		it("lists 8 distinct points", () => {
			expect(new Set(TORSION.map(([, , encoded]) => encoded)).size).toBe(8);
		});

		for (const [name, encoded] of NON_CANONICAL_TORSION) {
			it(`rejects non-canonical ${name}`, () => {
				expect(Ed25519.validatePublicKey(hex(encoded))).toBe(false);
			});
		}
	});

	describe("non-canonical y >= p", () => {
		it("rejects every y in [p, 2^255 - 1], with and without the sign bit", () => {
			for (let y = P; y < 1n << 255n; y++) {
				expect(Ed25519.validatePublicKey(encodeY(y, 0))).toBe(false);
				expect(Ed25519.validatePublicKey(encodeY(y, 1))).toBe(false);
			}
		});

		it("rejects all-0xff", () => {
			expect(Ed25519.validatePublicKey(new Uint8Array(32).fill(0xff))).toBe(
				false,
			);
		});

		it("rejects a non-canonical alias of a valid key that lax decoders accept", () => {
			// y = p + 3 reduces to y = 3. ZIP-215 decoding accepts it when y = 3
			// is on the curve, so strict decoding has to be what rejects it.
			const alias = encodeY(P + 3n);
			let laxAccepts = true;
			try {
				ed25519.Point.fromBytes(alias, true);
			} catch {
				laxAccepts = false;
			}
			expect(Ed25519.validatePublicKey(alias)).toBe(false);
			if (laxAccepts) {
				expect(() => ed25519.Point.fromBytes(alias, false)).toThrow();
			}
		});
	});

	describe("points not on the curve", () => {
		it("rejects y values with no matching x", () => {
			let found = 0;
			for (let y = 2n; found < 8; y++) {
				let onCurve = true;
				try {
					ed25519.Point.fromBytes(encodeY(y), true);
				} catch {
					onCurve = false;
				}
				if (!onCurve) {
					found++;
					expect(Ed25519.validatePublicKey(encodeY(y, 0))).toBe(false);
					expect(Ed25519.validatePublicKey(encodeY(y, 1))).toBe(false);
				}
			}
			expect(found).toBe(8);
		});
	});

	describe("mixed-order points", () => {
		it("rejects valid key + torsion point for all 7 non-identity torsion points", () => {
			const valid = ed25519.Point.fromBytes(hex(RFC8032[0]?.public as string));
			for (const [, order, encoded] of TORSION) {
				if (order === 1) continue;
				const torsion = ed25519.Point.fromBytes(hex(encoded), false);
				const mixed = valid.add(torsion);
				// On the curve, canonical, not small-order: only the subgroup
				// check can reject it.
				expect(mixed.isSmallOrder()).toBe(false);
				expect(mixed.isTorsionFree()).toBe(false);
				expect(Ed25519.validatePublicKey(mixed.toBytes())).toBe(false);
			}
		});
	});

	describe("valid keys", () => {
		for (const vector of RFC8032) {
			it(`accepts RFC 8032 ${vector.name} public key`, () => {
				const publicKey = hex(vector.public);
				expect(Ed25519.validatePublicKey(publicKey)).toBe(true);
				expect(Ed25519.isValidPublicKey(publicKey)).toBe(true);
				expect(Ed25519.derivePublicKey(hex(vector.secret))).toEqual(publicKey);
			});

			it(`still verifies RFC 8032 ${vector.name} signature`, () => {
				expect(
					Ed25519.verify(
						hex(vector.signature),
						hex(vector.message),
						hex(vector.public),
					),
				).toBe(true);
				expect(Ed25519.sign(hex(vector.message), hex(vector.secret))).toEqual(
					hex(vector.signature),
				);
			});
		}

		it("accepts the base point", () => {
			expect(Ed25519.validatePublicKey(ed25519.Point.BASE.toBytes())).toBe(
				true,
			);
		});

		it("accepts derived public keys", () => {
			for (let i = 0; i < 32; i++) {
				const { publicKey } = Ed25519.keypairFromSeed(
					crypto.getRandomValues(new Uint8Array(32)),
				);
				expect(Ed25519.validatePublicKey(publicKey)).toBe(true);
			}
		});
	});

	describe("length and type", () => {
		it("rejects wrong lengths", () => {
			for (const length of [0, 1, 31, 33, 64]) {
				expect(Ed25519.validatePublicKey(new Uint8Array(length).fill(1))).toBe(
					false,
				);
			}
		});

		it("rejects non-Uint8Array input", () => {
			// @ts-expect-error testing invalid input
			expect(Ed25519.validatePublicKey("00".repeat(32))).toBe(false);
			// @ts-expect-error testing invalid input
			expect(Ed25519.validatePublicKey(null)).toBe(false);
		});
	});

	describe("verify under weak keys", () => {
		it("rejects the universal forgery under every small-order key", () => {
			// With A of small order, R = identity and S = 0 satisfy the cofactored
			// equation [8][S]B = [8]R + [8][k]A for every message.
			const forged = new Uint8Array(64);
			forged[0] = 1; // R = identity, S = 0
			const messages = [new Uint8Array(0), new Uint8Array([1, 2, 3])];
			for (const [, , encoded] of TORSION) {
				for (const message of messages) {
					expect(Ed25519.verify(forged, message, hex(encoded))).toBe(false);
				}
			}
		});

		it("the forgery is real: the unhardened verifier accepts it", () => {
			const forged = new Uint8Array(64);
			forged[0] = 1;
			const identity = hex(TORSION[0]?.[2] as string);
			expect(ed25519.verify(forged, new Uint8Array([1, 2, 3]), identity)).toBe(
				true,
			);
		});

		it("returns false for non-canonical and off-curve keys", () => {
			const { signature, message } = {
				signature: hex(RFC8032[1]?.signature as string),
				message: hex(RFC8032[1]?.message as string),
			};
			for (const [, encoded] of NON_CANONICAL_TORSION) {
				expect(Ed25519.verify(signature, message, hex(encoded))).toBe(false);
			}
			expect(
				Ed25519.verify(signature, message, new Uint8Array(32).fill(0xff)),
			).toBe(false);
		});
	});
});
