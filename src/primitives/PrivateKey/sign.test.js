import { describe, expect, it } from "vitest";
import { sign as secp256k1Sign } from "../../crypto/Secp256k1/sign.js";
import { Hash } from "../Hash/index.js";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { Sign } from "./sign.js";

describe("PrivateKey.sign", () => {
	const sign = Sign({ secp256k1Sign });

	describe("signature creation", () => {
		it("creates signature from private key and hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3, 4]));
			const sig = sign(pk, hash);

			expect(sig).toHaveProperty("r");
			expect(sig).toHaveProperty("s");
			expect(sig).toHaveProperty("v");
		});

		it("creates signature from known test key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const hash = Hash.keccak256(message);
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("creates signature with 32 byte hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash(
				"0x1234567890123456789012345678901234567890123456789012345678901234",
			);
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("creates ECDSA signature", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
			const sig = sign(pk, hash);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
		});
	});

	describe("determinism tests", () => {
		it("produces same signature for same inputs", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig1 = sign(pk, hash);
			const sig2 = sign(pk, hash);

			expect(sig1.r.every((b, i) => b === sig2.r[i])).toBe(true);
			expect(sig1.s.every((b, i) => b === sig2.s[i])).toBe(true);
			expect(sig1.v).toBe(sig2.v);
		});

		it("produces different signatures for different private keys", () => {
			const pk1 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig1 = sign(pk1, hash);
			const sig2 = sign(pk2, hash);

			const different =
				sig1.r.some((b, i) => b !== sig2.r[i]) ||
				sig1.s.some((b, i) => b !== sig2.s[i]);
			expect(different).toBe(true);
		});

		it("produces different signatures for different hashes", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const hash2 = Hash.keccak256(new Uint8Array([4, 5, 6]));
			const sig1 = sign(pk, hash1);
			const sig2 = sign(pk, hash2);

			const different =
				sig1.r.some((b, i) => b !== sig2.r[i]) ||
				sig1.s.some((b, i) => b !== sig2.s[i]);
			expect(different).toBe(true);
		});

		it("is deterministic with RFC 6979", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([7, 8, 9]));
			const sig1 = sign(pk, hash);
			const sig2 = sign(pk, hash);

			expect(sig1).toEqual(sig2);
		});
	});

	describe("signature format", () => {
		it("returns signature object with r, s, v", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(sig).toHaveProperty("r");
			expect(sig).toHaveProperty("s");
			expect(sig).toHaveProperty("v");
			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
			expect(typeof sig.v).toBe("number");
		});

		it("signature components have expected length", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(sig.r.length).toBe(32);
			expect(sig.s.length).toBe(32);
			expect([27, 28]).toContain(sig.v);
		});

		it("signature is non-zero", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(sig.r.some((b) => b !== 0)).toBe(true);
			expect(sig.s.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("signature verification", () => {
		it("creates verifiable signature", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk, hash);
			const { toPublicKey } = await import("./toPublicKey.js");
			const { Verify } = await import("../PublicKey/verify.js");
			const { verify: secp256k1Verify } = await import(
				"../../crypto/Secp256k1/verify.js"
			);

			const pubkey = toPublicKey.call(pk);
			const verify = Verify({ secp256k1Verify });
			const valid = verify(pubkey, hash, sig);

			expect(valid).toBe(true);
		});

		it("signature fails with wrong public key", async () => {
			const pk1 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk1, hash);
			const { toPublicKey } = await import("./toPublicKey.js");
			const { Verify } = await import("../PublicKey/verify.js");
			const { verify: secp256k1Verify } = await import(
				"../../crypto/Secp256k1/verify.js"
			);

			const pubkey2 = toPublicKey.call(pk2);
			const verify = Verify({ secp256k1Verify });
			const valid = verify(pubkey2, hash, sig);

			expect(valid).toBe(false);
		});

		it("signature fails with wrong hash", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const hash2 = Hash.keccak256(new Uint8Array([4, 5, 6]));
			const sig = sign(pk, hash1);
			const { toPublicKey } = await import("./toPublicKey.js");
			const { Verify } = await import("../PublicKey/verify.js");
			const { verify: secp256k1Verify } = await import(
				"../../crypto/Secp256k1/verify.js"
			);

			const pubkey = toPublicKey.call(pk);
			const verify = Verify({ secp256k1Verify });
			const valid = verify(pubkey, hash2, sig);

			expect(valid).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("signs with minimum valid private key", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 0x01;
			const pk = fromBytes(bytes);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(sig).toHaveProperty("r");
			expect(sig).toHaveProperty("s");
			expect(sig).toHaveProperty("v");
		});

		it("signs zero hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("signs max hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("signs empty message hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([]));
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("signs single byte message hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([0xff]));
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});

		it("signs large message hash", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const largeMessage = new Uint8Array(1000).fill(0xab);
			const hash = Hash.keccak256(largeMessage);
			const sig = sign(pk, hash);

			expect(sig.r).toBeInstanceOf(Uint8Array);
			expect(sig.s).toBeInstanceOf(Uint8Array);
		});
	});

	describe("factory pattern", () => {
		it("Sign factory returns signing function", () => {
			const signFn = Sign({ secp256k1Sign });
			expect(typeof signFn).toBe("function");
		});

		it("signing function accepts private key and hash", () => {
			const signFn = Sign({ secp256k1Sign });
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1]));

			expect(() => signFn(pk, hash)).not.toThrow();
		});

		it("factory can create multiple signing instances", () => {
			const signFn1 = Sign({ secp256k1Sign });
			const signFn2 = Sign({ secp256k1Sign });

			expect(signFn1).not.toBe(signFn2);
		});
	});

	describe("integration tests", () => {
		it("full signature round-trip", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const message = new TextEncoder().encode("Test message");
			const hash = Hash.keccak256(message);
			const sig = sign(pk, hash);
			const { toPublicKey } = await import("./toPublicKey.js");
			const { Verify } = await import("../PublicKey/verify.js");
			const { verify: secp256k1Verify } = await import(
				"../../crypto/Secp256k1/verify.js"
			);

			const pubkey = toPublicKey.call(pk);
			const verify = Verify({ secp256k1Verify });

			expect(verify(pubkey, hash, sig)).toBe(true);
		});

		it("works with derived public key", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk, hash);
			const { toPublicKey } = await import("./toPublicKey.js");
			const { Verify } = await import("../PublicKey/verify.js");
			const { verify: secp256k1Verify } = await import(
				"../../crypto/Secp256k1/verify.js"
			);

			const pubkey = toPublicKey.call(pk);
			const verify = Verify({ secp256k1Verify });
			const valid = verify(pubkey, hash, sig);

			expect(valid).toBe(true);
		});
	});
});
