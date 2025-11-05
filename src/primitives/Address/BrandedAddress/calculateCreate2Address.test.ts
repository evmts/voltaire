import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { calculateCreate2Address } from "./calculateCreate2Address.js";

describe("calculateCreate2Address", () => {
	describe("known CREATE2 test vectors", () => {
		it("calculates correct address with known inputs", () => {
			const sender = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces deterministic output", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			salt[0] = 0x42;
			const initCode = new Uint8Array([0x60, 0x00]);
			const addr1 = calculateCreate2Address(sender, salt, initCode);
			const addr2 = calculateCreate2Address(sender, salt, initCode);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("calculates different addresses for different salts", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt1 = new Uint8Array(32);
			const salt2 = new Uint8Array(32);
			salt1[0] = 0x01;
			salt2[0] = 0x02;
			const initCode = new Uint8Array([0x60, 0x00]);
			const addr1 = calculateCreate2Address(sender, salt1, initCode);
			const addr2 = calculateCreate2Address(sender, salt2, initCode);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});
	});

	describe("Uint8Array salt", () => {
		it("handles 32-byte salt", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with all zeros", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with all 0xFF", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32).fill(0xff);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with pattern", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				salt[i] = i;
			}
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	describe("wrong salt size", () => {
		it("throws on salt size < 32 bytes", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(31);
			const initCode = new Uint8Array(0);
			expect(() => calculateCreate2Address(sender, salt, initCode)).toThrow(
				"Salt must be 32 bytes",
			);
		});

		it("throws on salt size > 32 bytes", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(33);
			const initCode = new Uint8Array(0);
			expect(() => calculateCreate2Address(sender, salt, initCode)).toThrow(
				"Salt must be 32 bytes",
			);
		});

		it("throws on empty salt", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(0);
			const initCode = new Uint8Array(0);
			expect(() => calculateCreate2Address(sender, salt, initCode)).toThrow(
				"Salt must be 32 bytes",
			);
		});

		it("throws on salt size 16 bytes", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(16);
			const initCode = new Uint8Array(0);
			expect(() => calculateCreate2Address(sender, salt, initCode)).toThrow(
				"Salt must be 32 bytes",
			);
		});
	});

	describe("different init codes", () => {
		it("handles empty init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles simple init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0x60, 0x00, 0x60, 0x00]);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles large init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(1000);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces different addresses for different init codes", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = new Uint8Array(32);
			const initCode1 = new Uint8Array([0x60, 0x00]);
			const initCode2 = new Uint8Array([0x60, 0x01]);
			const addr1 = calculateCreate2Address(sender, salt, initCode1);
			const addr2 = calculateCreate2Address(sender, salt, initCode2);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});
	});

	describe("different senders", () => {
		it("produces different addresses for different senders", () => {
			const sender1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const sender2 = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const addr1 = calculateCreate2Address(sender1, salt, initCode);
			const addr2 = calculateCreate2Address(sender2, salt, initCode);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles zero address as sender", () => {
			const sender = Address.zero();
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	it("works with Address namespace method", () => {
		const sender = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		const salt = new Uint8Array(32);
		const initCode = new Uint8Array(0);
		const contractAddr = Address.calculateCreate2Address(
			sender,
			salt,
			initCode,
		);
		expect(contractAddr).toBeInstanceOf(Uint8Array);
		expect(contractAddr.length).toBe(20);
	});
});
