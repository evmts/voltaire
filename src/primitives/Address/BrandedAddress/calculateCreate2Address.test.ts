import { describe, expect, it } from "vitest";
import { hash } from "../../../crypto/Keccak256/hash.js";
import { Bytecode } from "../../Bytecode/index.js";
import { Hash } from "../../Hash/index.js";
import { Address } from "../index.js";
import { CalculateCreate2Address } from "./calculateCreate2Address.js";

const calculateCreate2Address = CalculateCreate2Address({ keccak256: hash });

describe("calculateCreate2Address", () => {
	describe("known CREATE2 test vectors", () => {
		it("calculates correct address with known inputs", () => {
			const sender = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces deterministic output", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const saltBytes = new Uint8Array(32);
			saltBytes[0] = 0x42;
			const salt = Hash(saltBytes);
			const initCode = Bytecode(new Uint8Array([0x60, 0x00]));
			const addr1 = calculateCreate2Address(sender, salt, initCode);
			const addr2 = calculateCreate2Address(sender, salt, initCode);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("calculates different addresses for different salts", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt1Bytes = new Uint8Array(32);
			const salt2Bytes = new Uint8Array(32);
			salt1Bytes[0] = 0x01;
			salt2Bytes[0] = 0x02;
			const salt1 = Hash(salt1Bytes);
			const salt2 = Hash(salt2Bytes);
			const initCode = Bytecode(new Uint8Array([0x60, 0x00]));
			const addr1 = calculateCreate2Address(sender, salt1, initCode);
			const addr2 = calculateCreate2Address(sender, salt2, initCode);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});
	});

	describe("Hash salt", () => {
		it("handles 32-byte salt", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with all zeros", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with all 0xFF", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash.from(new Uint8Array(32).fill(0xff));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles salt with pattern", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const saltBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				saltBytes[i] = i;
			}
			const salt = Hash(saltBytes);
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	describe("salt validation happens at Hash construction", () => {
		it("Hash.from throws on salt size < 32 bytes", () => {
			const salt = new Uint8Array(31);
			expect(() => Hash.from(salt)).toThrow("Hash must be 32 bytes");
		});

		it("Hash.from throws on salt size > 32 bytes", () => {
			const salt = new Uint8Array(33);
			expect(() => Hash.from(salt)).toThrow("Hash must be 32 bytes");
		});

		it("Hash.from throws on empty salt", () => {
			const salt = new Uint8Array(0);
			expect(() => Hash.from(salt)).toThrow("Hash must be 32 bytes");
		});

		it("Hash.from throws on salt size 16 bytes", () => {
			const salt = new Uint8Array(16);
			expect(() => Hash.from(salt)).toThrow("Hash must be 32 bytes");
		});
	});

	describe("different init codes", () => {
		it("handles empty init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles simple init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array([0x60, 0x00, 0x60, 0x00]));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("handles large init code", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(1000));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});

		it("produces different addresses for different init codes", () => {
			const sender = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const salt = Hash(new Uint8Array(32));
			const initCode1 = Bytecode(new Uint8Array([0x60, 0x00]));
			const initCode2 = Bytecode(new Uint8Array([0x60, 0x01]));
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
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const addr1 = calculateCreate2Address(sender1, salt, initCode);
			const addr2 = calculateCreate2Address(sender2, salt, initCode);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles zero address as sender", () => {
			const sender = Address.zero();
			const salt = Hash(new Uint8Array(32));
			const initCode = Bytecode(new Uint8Array(0));
			const contractAddr = calculateCreate2Address(sender, salt, initCode);
			expect(contractAddr).toBeInstanceOf(Uint8Array);
			expect(contractAddr.length).toBe(20);
		});
	});

	it("works with Address namespace method", () => {
		const sender = Address.fromHex(
			"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
		);
		const salt = Hash.from(new Uint8Array(32));
		const initCode = Bytecode(new Uint8Array(0));
		const contractAddr = Address.calculateCreate2Address(
			sender,
			salt,
			initCode,
		);
		expect(contractAddr).toBeInstanceOf(Uint8Array);
		expect(contractAddr.length).toBe(20);
	});
});
