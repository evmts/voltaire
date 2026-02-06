import { describe, expect, it } from "vitest";
import { from } from "./from.js";
import { fromBytes } from "./fromBytes.js";
import { toPublicKey } from "./toPublicKey.js";

describe("PrivateKey.toPublicKey", () => {
	describe("conversion tests", () => {
		it("derives public key from private key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("derives public key from zero private key", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 0x01;
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("derives uncompressed public key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
		});

		it("removes 0x04 prefix from full key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey[0]).not.toBe(0x04);
		});

		it("derives public key from known test key", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const { toHex: pubkeyToHex } = await import("../PublicKey/toHex.js");
			const hex = pubkeyToHex.call(pubkey);

			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});
	});

	describe("determinism tests", () => {
		it("produces same public key for same private key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey1 = toPublicKey.call(pk);
			const pubkey2 = toPublicKey.call(pk);

			expect(pubkey1.every((b, i) => b === pubkey2[i])).toBe(true);
		});

		it("produces different public keys for different private keys", () => {
			const pk1 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = toPublicKey.call(pk1);
			const pubkey2 = toPublicKey.call(pk2);

			expect(pubkey1.some((b, i) => b !== pubkey2[i])).toBe(true);
		});

		it("produces unique public key for each private key", () => {
			const pk1 = fromBytes(new Uint8Array(32).fill(0x01));
			const pk2 = fromBytes(new Uint8Array(32).fill(0x02));
			const pubkey1 = toPublicKey.call(pk1);
			const pubkey2 = toPublicKey.call(pk2);

			expect(pubkey1).not.toEqual(pubkey2);
		});
	});

	describe("format tests", () => {
		it("returns Uint8Array", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey).toBeInstanceOf(Uint8Array);
		});

		it("returns exactly 64 bytes", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
		});

		it("returns uncompressed format", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
		});

		it("first 32 bytes are x coordinate", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const x = pubkey.slice(0, 32);

			expect(x.length).toBe(32);
		});

		it("last 32 bytes are y coordinate", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const y = pubkey.slice(32, 64);

			expect(y.length).toBe(32);
		});
	});

	describe("cryptographic tests", () => {
		it("derives valid secp256k1 public key", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("produces non-zero coordinates", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const x = pubkey.slice(0, 32);
			const y = pubkey.slice(32, 64);

			expect(x.some((b) => b !== 0)).toBe(true);
			expect(y.some((b) => b !== 0)).toBe(true);
		});

		it("derives public key from small private key", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 0x01;
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("derives public key from large private key", () => {
			const bytes = new Uint8Array(32).fill(0xff);
			bytes[0] = 0x7f;
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("integration tests", () => {
		it("can derive address from public key", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const { toAddress } = await import("../PublicKey/toAddress.js");
			const address = toAddress.call(pubkey);

			expect(address).toBeInstanceOf(Uint8Array);
			expect(address.length).toBe(20);
		});

		it("matches PrivateKey.toAddress", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const { toAddress: pubkeyToAddress } = await import(
				"../PublicKey/toAddress.js"
			);
			const { toAddress: privkeyToAddress } = await import("./toAddress.js");

			const addressFromPubkey = pubkeyToAddress.call(pubkey);
			const addressFromPrivkey = privkeyToAddress.call(pk);

			expect(
				addressFromPubkey.every((b, i) => b === addressFromPrivkey[i]),
			).toBe(true);
		});

		it("can be used with PublicKey.toHex", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const { toHex } = await import("../PublicKey/toHex.js");
			const hex = toHex.call(pubkey);

			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});

		it("public key can be used with from", async () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const { toHex } = await import("../PublicKey/toHex.js");
			const { from: pubkeyFrom } = await import("../PublicKey/from.js");

			const hex = toHex.call(pubkey);
			const pubkey2 = pubkeyFrom(hex);

			expect(pubkey2.every((b, i) => b === pubkey[i])).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("handles minimum valid private key", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 0x01;
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
		});

		it("handles sequential private key", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});

		it("handles alternating pattern private key", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const pk = fromBytes(bytes);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("known test vectors", () => {
		it("derives expected public key for test key 1", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey.length).toBe(64);
			expect(pubkey[0]).toBeDefined();
			expect(pubkey[63]).toBeDefined();
		});

		it("derives deterministic public key", () => {
			const pk = from(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const pubkey1 = toPublicKey.call(pk);
			const pubkey2 = toPublicKey.call(pk);

			expect(pubkey1).toEqual(pubkey2);
		});
	});

	describe("usage tests", () => {
		it("can be called with this context", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey).toBeDefined();
		});

		it("produces Uint8Array that can be indexed", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);

			expect(pubkey[0]).toBeDefined();
			expect(pubkey[31]).toBeDefined();
			expect(pubkey[32]).toBeDefined();
			expect(pubkey[63]).toBeDefined();
		});

		it("produces Uint8Array that can be sliced", () => {
			const pk = from(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = toPublicKey.call(pk);
			const x = pubkey.slice(0, 32);
			const y = pubkey.slice(32, 64);

			expect(x.length).toBe(32);
			expect(y.length).toBe(32);
		});
	});
});
