import { describe, it, expect } from "vitest";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { from as privateKeyFrom } from "../PrivateKey/from.js";
import { fromBytes as privateKeyFromBytes } from "../PrivateKey/fromBytes.js";

describe("PublicKey.fromPrivateKey", () => {
	describe("conversion tests", () => {
		it("derives public key from private key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("derives public key from minimum private key", () => {
			const pk = privateKeyFromBytes(new Uint8Array(32));
			pk[31] = 0x01;
			const pubkey = fromPrivateKey(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("derives uncompressed public key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
		});

		it("removes 0x04 prefix", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey[0]).not.toBe(0x04);
		});

		it("derives from known test key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const { toHex } = await import("./toHex.js");

			const hex = toHex.call(pubkey);
			expect(hex).toBeDefined();
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});
	});

	describe("format tests", () => {
		it("returns Uint8Array", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
		});

		it("returns exactly 64 bytes", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
		});

		it("first 32 bytes are x coordinate", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const x = pubkey.slice(0, 32);

			expect(x.length).toBe(32);
			expect(x.some((b) => b !== 0)).toBe(true);
		});

		it("last 32 bytes are y coordinate", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const y = pubkey.slice(32, 64);

			expect(y.length).toBe(32);
			expect(y.some((b) => b !== 0)).toBe(true);
		});

		it("contains non-zero bytes", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("determinism tests", () => {
		it("produces same public key for same private key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey1 = fromPrivateKey(pk);
			const pubkey2 = fromPrivateKey(pk);

			expect(pubkey1.every((b, i) => b === pubkey2[i])).toBe(true);
		});

		it("produces different public keys for different private keys", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = fromPrivateKey(pk1);
			const pubkey2 = fromPrivateKey(pk2);

			expect(pubkey1.some((b, i) => b !== pubkey2[i])).toBe(true);
		});

		it("is deterministic", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey1 = fromPrivateKey(pk);
			const pubkey2 = fromPrivateKey(pk);

			expect(pubkey1).toEqual(pubkey2);
		});

		it("produces unique keys", () => {
			const pk1 = privateKeyFromBytes(new Uint8Array(32).fill(0x01));
			const pk2 = privateKeyFromBytes(new Uint8Array(32).fill(0x02));
			const pubkey1 = fromPrivateKey(pk1);
			const pubkey2 = fromPrivateKey(pk2);

			expect(pubkey1).not.toEqual(pubkey2);
		});
	});

	describe("cryptographic properties", () => {
		it("derives valid secp256k1 public key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("x and y coordinates are non-zero", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const x = pubkey.slice(0, 32);
			const y = pubkey.slice(32, 64);

			expect(x.some((b) => b !== 0)).toBe(true);
			expect(y.some((b) => b !== 0)).toBe(true);
		});

		it("derives from small private key", () => {
			const pk = privateKeyFromBytes(new Uint8Array(32));
			pk[31] = 0x01;
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("derives from large private key", () => {
			const pk = privateKeyFromBytes(new Uint8Array(32).fill(0xff));
			pk[0] = 0x7f;
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("integration tests", () => {
		it("can be used with toHex", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const { toHex } = await import("./toHex.js");

			const hex = toHex.call(pubkey);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});

		it("can be used with toAddress", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const { toAddress } = await import("./toAddress.js");

			const address = toAddress.call(pubkey);
			expect(address).toBeInstanceOf(Uint8Array);
			expect(address.length).toBe(20);
		});

		it("can be used with from", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey1 = fromPrivateKey(pk);
			const { toHex } = await import("./toHex.js");
			const { from } = await import("./from.js");

			const hex = toHex.call(pubkey1);
			const pubkey2 = from(hex);

			expect(pubkey2.every((b, i) => b === pubkey1[i])).toBe(true);
		});

		it("matches PrivateKey.toPublicKey", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey1 = fromPrivateKey(pk);
			const { toPublicKey } = await import("../PrivateKey/toPublicKey.js");

			const pubkey2 = toPublicKey.call(pk);

			expect(pubkey1.every((b, i) => b === pubkey2[i])).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("handles minimum valid private key", () => {
			const pk = privateKeyFromBytes(new Uint8Array(32));
			pk[31] = 0x01;
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("handles sequential private key", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const pk = privateKeyFromBytes(bytes);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("handles alternating pattern private key", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const pk = privateKeyFromBytes(bytes);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("handles known test vector 1", () => {
			const pk = privateKeyFrom(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
		});

		it("handles known test vector 2", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("type tests", () => {
		it("returns PublicKeyType", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("can be indexed", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			expect(pubkey[0]).toBeDefined();
			expect(pubkey[31]).toBeDefined();
			expect(pubkey[32]).toBeDefined();
			expect(pubkey[63]).toBeDefined();
		});

		it("can be sliced", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const x = pubkey.slice(0, 32);
			const y = pubkey.slice(32, 64);

			expect(x.length).toBe(32);
			expect(y.length).toBe(32);
		});

		it("supports iteration", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			let count = 0;
			for (const _byte of pubkey) {
				count++;
			}
			expect(count).toBe(64);
		});
	});
});
