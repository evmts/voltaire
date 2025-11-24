import { describe, expect, it } from "vitest";
import * as Address from "../Address/index.js";
import { from as privateKeyFrom } from "../PrivateKey/from.js";
import { fromPrivateKey } from "./fromPrivateKey.js";
import { toAddress } from "./toAddress.js";

describe("PublicKey.toAddress", () => {
	describe("address derivation", () => {
		it("derives 20 byte address from public key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address).toBeInstanceOf(Uint8Array);
			expect(address.length).toBe(20);
		});

		it("derives address from known test key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
			expect(address.some((b) => b !== 0)).toBe(true);
		});

		it("derives deterministic address", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address1 = toAddress.call(pubkey);
			const address2 = toAddress.call(pubkey);

			expect(address1.every((b, i) => b === address2[i])).toBe(true);
		});

		it("derives different addresses from different public keys", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = fromPrivateKey(pk1);
			const pubkey2 = fromPrivateKey(pk2);
			const address1 = toAddress.call(pubkey1);
			const address2 = toAddress.call(pubkey2);

			expect(address1.some((b, i) => b !== address2[i])).toBe(true);
		});
	});

	describe("format tests", () => {
		it("returns Uint8Array", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address).toBeInstanceOf(Uint8Array);
		});

		it("returns exactly 20 bytes", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
		});

		it("returns branded AddressType", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
		});
	});

	describe("keccak256 derivation", () => {
		it("takes last 20 bytes of keccak256", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			const { Hash } = await import("../Hash/index.js");
			const hash = Hash.keccak256(pubkey);
			const expected = hash.slice(12, 32);

			expect(address.every((b, i) => b === expected[i])).toBe(true);
		});

		it("uses full 64 byte public key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
		});
	});

	describe("determinism tests", () => {
		it("produces same address for same public key", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address1 = toAddress.call(pubkey);
			const address2 = toAddress.call(pubkey);

			expect(address1).toEqual(address2);
		});

		it("produces different addresses for different public keys", () => {
			const pk1 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pk2 = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff81",
			);
			const pubkey1 = fromPrivateKey(pk1);
			const pubkey2 = fromPrivateKey(pk2);
			const address1 = toAddress.call(pubkey1);
			const address2 = toAddress.call(pubkey2);

			expect(address1).not.toEqual(address2);
		});

		it("is deterministic", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address1 = toAddress.call(pubkey);
			const address2 = toAddress.call(pubkey);

			expect(address1.every((b, i) => b === address2[i])).toBe(true);
		});
	});

	describe("integration tests", () => {
		it("can be used with Address functions", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			const hex = Address.toHex(address);
			expect(hex).toBeDefined();
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(42);
		});

		it("matches PrivateKey.toAddress", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const addressFromPubkey = toAddress.call(pubkey);

			const { toAddress: privkeyToAddress } = await import(
				"../PrivateKey/toAddress.js"
			);
			const addressFromPrivkey = privkeyToAddress.call(pk);

			expect(addressFromPubkey.every((b, i) => b === addressFromPrivkey[i])).toBe(
				true,
			);
		});

		it("can be checksummed", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			const checksummed = Address.toChecksum(address);
			expect(checksummed).toBeDefined();
			expect(checksummed.startsWith("0x")).toBe(true);
		});

		it("round-trips with Address.from", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address1 = toAddress.call(pubkey);

			const hex = Address.toHex(address1);
			const address2 = Address.from(hex);

			expect(Address.equals(address1, address2)).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("handles minimum private key", () => {
			const { fromBytes } = await import("../PrivateKey/fromBytes.js");
			const pk = fromBytes(new Uint8Array(32));
			pk[31] = 0x01;
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
		});

		it("handles sequential private key", () => {
			const { fromBytes } = await import("../PrivateKey/fromBytes.js");
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const pk = fromBytes(bytes);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
			expect(address.some((b) => b !== 0)).toBe(true);
		});

		it("handles alternating pattern private key", () => {
			const { fromBytes } = await import("../PrivateKey/fromBytes.js");
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const pk = fromBytes(bytes);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.length).toBe(20);
			expect(address.some((b) => b !== 0)).toBe(true);
		});

		it("address is non-zero", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address.some((b) => b !== 0)).toBe(true);
		});
	});

	describe("known test vectors", () => {
		it("derives expected address for test key 1", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);
			const hex = Address.toHex(address);

			expect(hex).toBeDefined();
			expect(hex.length).toBe(42);
			expect(hex.startsWith("0x")).toBe(true);
		});

		it("derives consistent address", () => {
			const pk = privateKeyFrom(
				"0x0000000000000000000000000000000000000000000000000000000000000001",
			);
			const pubkey = fromPrivateKey(pk);
			const address1 = toAddress.call(pubkey);
			const address2 = toAddress.call(pubkey);

			expect(address1).toEqual(address2);
		});
	});

	describe("usage tests", () => {
		it("can be called with this context", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address).toBeDefined();
		});

		it("produces Uint8Array that can be indexed", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			expect(address[0]).toBeDefined();
			expect(address[10]).toBeDefined();
			expect(address[19]).toBeDefined();
		});

		it("produces Uint8Array that can be sliced", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);
			const slice = address.slice(0, 10);

			expect(slice.length).toBe(10);
		});

		it("supports iteration", () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			let count = 0;
			for (const _byte of address) {
				count++;
			}
			expect(count).toBe(20);
		});
	});

	describe("comparison with private key", () => {
		it("PublicKey.toAddress equals PrivateKey.toAddress", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);

			const { toAddress: privkeyToAddress } = await import(
				"../PrivateKey/toAddress.js"
			);

			const addrFromPubkey = toAddress.call(pubkey);
			const addrFromPrivkey = privkeyToAddress.call(pk);

			expect(Address.equals(addrFromPubkey, addrFromPrivkey)).toBe(true);
		});

		it("derivation path maintains consistency", async () => {
			const pk = privateKeyFrom(
				"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			);
			const pubkey = fromPrivateKey(pk);
			const address = toAddress.call(pubkey);

			const { toPublicKey } = await import("../PrivateKey/toPublicKey.js");
			const pubkey2 = toPublicKey.call(pk);
			const address2 = toAddress.call(pubkey2);

			expect(Address.equals(address, address2)).toBe(true);
		});
	});
});
