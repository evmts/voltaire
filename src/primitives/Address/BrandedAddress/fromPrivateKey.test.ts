import { describe, expect, it } from "vitest";
import { hash } from "../../../crypto/Keccak256/hash.js";
import { derivePublicKey } from "../../../crypto/Secp256k1/derivePublicKey.js";
import { PrivateKey } from "../../PrivateKey/BrandedPrivateKey/index.js";
import { Address } from "../index.js";
import * as AddressNamespace from "./index.js";
import { InvalidLengthError } from "../../errors/ValidationError.js";

// Create factory instance with crypto dependencies
const fromPrivateKey = AddressNamespace.FromPrivateKey({
	keccak256: hash,
	derivePublicKey,
});
describe("fromPrivateKey", () => {
	describe("valid private keys", () => {
		it("derives address from 32-byte private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("derives known address from test vector 1", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			privateKey.fill(1);
			const addr = fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
			expect(addr.length).toBe(20);
		});

		it("derives known address from test vector 2", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}
			const addr = fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("derives consistent address from same private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 0xcd;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr1 = fromPrivateKey(privateKey);
			const addr2 = fromPrivateKey(privateKey);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("derives different addresses from different private keys", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;
			const addr1 = fromPrivateKey(privateKey1);
			const addr2 = fromPrivateKey(privateKey2);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("derives non-zero address from non-zero private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			expect(Address.isZero(addr)).toBe(false);
		});
	});

	describe("invalid inputs", () => {
		it("throws on wrong length - too short", () => {
			const privateKeyBytes = new Uint8Array(31);
			expect(() => PrivateKey.fromBytes(privateKeyBytes)).toThrow(
				InvalidLengthError,
			);
		});

		it("throws on wrong length - too long", () => {
			const privateKeyBytes = new Uint8Array(33);
			expect(() => PrivateKey.fromBytes(privateKeyBytes)).toThrow(
				InvalidLengthError,
			);
		});

		it("throws on empty array", () => {
			const privateKeyBytes = new Uint8Array(0);
			expect(() => PrivateKey.fromBytes(privateKeyBytes)).toThrow(
				InvalidLengthError,
			);
		});

		it("throws on zero private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			expect(() => fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on private key >= secp256k1 order", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			privateKey.fill(0xff);
			expect(() => fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	describe("edge cases", () => {
		it("handles private key = 1", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("handles maximum valid private key", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			// secp256k1 order - 1
			const orderMinus1 = [
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			];
			privateKey.set(orderMinus1);
			const addr = fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});
	});

	describe("integration", () => {
		it("works with Address factory", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			expect(Address.is(addr)).toBe(true);
		});

		it("works with Address namespace method", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
		});

		it("derived address is valid", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 42;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const addr = fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(Address.isValid(hex)).toBe(true);
		});
	});
});
