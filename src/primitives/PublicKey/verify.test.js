import { describe, expect, it } from "vitest";
import { sign as secp256k1Sign } from "../../crypto/Secp256k1/sign.js";
import { verify as secp256k1Verify } from "../../crypto/Secp256k1/verify.js";
import { Hash } from "../Hash/index.js";
import { from as privateKeyFrom } from "../PrivateKey/from.js";
import { Sign } from "../PrivateKey/sign.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { Verify } from "./verify.js";

describe("PublicKey.verify", () => {
	const verify = Verify({ secp256k1Verify });
	const sign = Sign({ secp256k1Sign });

	describe("signature verification", () => {
		it("verifies valid signature", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("rejects invalid signature", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = fromPrivateKey(pk1);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk2, hash);

			const valid = verify(pubkey1, hash, sig);
			expect(valid).toBe(false);
		});

		it("rejects signature with wrong hash", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const hash2 = Hash.keccak256(new Uint8Array([4, 5, 6]));
			const sig = sign(pk, hash1);

			const valid = verify(pubkey, hash2, sig);
			expect(valid).toBe(false);
		});

		it("verifies known test signature", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const hash = Hash.keccak256(message);
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("returns boolean", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(typeof valid).toBe("boolean");
		});
	});

	describe("signature format handling", () => {
		it("verifies ECDSA signature", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("handles signature with recovery ID", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3, 4]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("adds 0x04 prefix to uncompressed key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(pubkey.length).toBe(64);
			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});
	});

	describe("determinism tests", () => {
		it("consistently verifies same signature", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk, hash);

			const valid1 = verify(pubkey, hash, sig);
			const valid2 = verify(pubkey, hash, sig);

			expect(valid1).toBe(valid2);
			expect(valid1).toBe(true);
		});

		it("consistently rejects invalid signature", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey = fromPrivateKey(pk1);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk2, hash);

			const valid1 = verify(pubkey, hash, sig);
			const valid2 = verify(pubkey, hash, sig);

			expect(valid1).toBe(valid2);
			expect(valid1).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("verifies signature from minimum private key", async () => {
			const { fromBytes } = await import("../PrivateKey/fromBytes.js");
			const pk = fromBytes(new Uint8Array(32));
			pk[31] = 0x01;
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verifies signature of zero hash", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verifies signature of max hash", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verifies signature of empty message", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verifies signature of single byte message", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([0xff]));
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verifies signature of large message", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const largeMessage = new Uint8Array(1000).fill(0xab);
			const hash = Hash.keccak256(largeMessage);
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("rejects corrupted signature", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk, hash);

			// Corrupt the r component of the signature
			/** @type {*} */ (sig).r[0] ^= 0xff;

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(false);
		});
	});

	describe("factory pattern", () => {
		it("Verify factory returns verification function", () => {
			const verifyFn = Verify({ secp256k1Verify });
			expect(typeof verifyFn).toBe("function");
		});

		it("verification function accepts public key, hash, and signature", () => {
			const verifyFn = Verify({ secp256k1Verify });
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1]));
			const sig = sign(pk, hash);

			expect(() => verifyFn(pubkey, hash, sig)).not.toThrow();
		});

		it("factory can create multiple verify instances", () => {
			const verifyFn1 = Verify({ secp256k1Verify });
			const verifyFn2 = Verify({ secp256k1Verify });

			expect(verifyFn1).not.toBe(verifyFn2);
		});
	});

	describe("integration tests", () => {
		it("full signature round-trip", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const message = new TextEncoder().encode("Test message");
			const hash = Hash.keccak256(message);
			const sig = sign(pk, hash);

			const valid = verify(pubkey, hash, sig);
			expect(valid).toBe(true);
		});

		it("verification fails with wrong public key", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey2 = fromPrivateKey(pk2);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig = sign(pk1, hash);

			const valid = verify(pubkey2, hash, sig);
			expect(valid).toBe(false);
		});

		it("verification fails with modified message", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const message1 = new Uint8Array([1, 2, 3]);
			const message2 = new Uint8Array([1, 2, 4]);
			const hash1 = Hash.keccak256(message1);
			const hash2 = Hash.keccak256(message2);
			const sig = sign(pk, hash1);

			const valid = verify(pubkey, hash2, sig);
			expect(valid).toBe(false);
		});

		it("works with multiple signatures", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			const hash1 = Hash.keccak256(new Uint8Array([1]));
			const hash2 = Hash.keccak256(new Uint8Array([2]));
			const sig1 = sign(pk, hash1);
			const sig2 = sign(pk, hash2);

			expect(verify(pubkey, hash1, sig1)).toBe(true);
			expect(verify(pubkey, hash2, sig2)).toBe(true);
			expect(verify(pubkey, hash1, sig2)).toBe(false);
			expect(verify(pubkey, hash2, sig1)).toBe(false);
		});
	});

	describe("security tests", () => {
		it("rejects signature from different key pair", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = fromPrivateKey(pk1);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const sig2 = sign(pk2, hash);

			const valid = verify(pubkey1, hash, sig2);
			expect(valid).toBe(false);
		});

		it("signature not transferable to different hash", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash1 = Hash.keccak256(new Uint8Array([1, 2, 3]));
			const hash2 = Hash.keccak256(new Uint8Array([1, 2, 4]));
			const sig = sign(pk, hash1);

			expect(verify(pubkey, hash1, sig)).toBe(true);
			expect(verify(pubkey, hash2, sig)).toBe(false);
		});

		it("cannot forge signature without private key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const hash = Hash.keccak256(new Uint8Array([1, 2, 3]));

			const fakeSig = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				fakeSig[i] = i;
			}

			const valid = verify(pubkey, hash, /** @type {*} */ (fakeSig));
			expect(valid).toBe(false);
		});
	});
});
