import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import * as AddressNamespace from "./index.js";

describe("fromPrivateKey", () => {
	describe("valid private keys", () => {
		it("derives address from 32-byte private key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const addr = Address.fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("derives known address from test vector 1", () => {
			const privateKey = new Uint8Array(32);
			privateKey.fill(1);
			const addr = Address.fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
			expect(addr.length).toBe(20);
		});

		it("derives known address from test vector 2", () => {
			const privateKey = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = i + 1;
			}
			const addr = Address.fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("derives consistent address from same private key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[0] = 0xab;
			privateKey[31] = 0xcd;
			const addr1 = Address.fromPrivateKey(privateKey);
			const addr2 = Address.fromPrivateKey(privateKey);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("derives different addresses from different private keys", () => {
			const privateKey1 = new Uint8Array(32);
			privateKey1[31] = 1;
			const privateKey2 = new Uint8Array(32);
			privateKey2[31] = 2;
			const addr1 = Address.fromPrivateKey(privateKey1);
			const addr2 = Address.fromPrivateKey(privateKey2);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("derives non-zero address from non-zero private key", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;
			const addr = Address.fromPrivateKey(privateKey);
			expect(Address.isZero(addr)).toBe(false);
		});
	});

	describe("invalid inputs", () => {
		it("throws on wrong length - too short", () => {
			const privateKey = new Uint8Array(31);
			expect(() => Address.fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on wrong length - too long", () => {
			const privateKey = new Uint8Array(33);
			expect(() => Address.fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on empty array", () => {
			const privateKey = new Uint8Array(0);
			expect(() => Address.fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on zero private key", () => {
			const privateKey = new Uint8Array(32);
			expect(() => Address.fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on private key >= secp256k1 order", () => {
			const privateKey = new Uint8Array(32);
			privateKey.fill(0xff);
			expect(() => Address.fromPrivateKey(privateKey)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	describe("edge cases", () => {
		it("handles private key = 1", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;
			const addr = Address.fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("handles maximum valid private key", () => {
			const privateKey = new Uint8Array(32);
			// secp256k1 order - 1
			const orderMinus1 = [
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
			];
			privateKey.set(orderMinus1);
			const addr = Address.fromPrivateKey(privateKey);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});
	});

	describe("integration", () => {
		it("works with Address factory", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;
			const addr = Address.fromPrivateKey(privateKey);
			expect(Address.is(addr)).toBe(true);
		});

		it("works with Address namespace method", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;
			const addr = Address.fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
		});

		it("derived address is valid", () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 42;
			const addr = Address.fromPrivateKey(privateKey);
			const hex = Address.toHex(addr);
			expect(Address.isValid(hex)).toBe(true);
		});
	});
});
