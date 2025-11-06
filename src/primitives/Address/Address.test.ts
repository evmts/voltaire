import { describe, expect, it } from "vitest";
import type { BrandedHex } from "../Hex/index.js";
import { Address } from "./Address.js";
import * as AddressNamespace from "./index.js";

describe("Address", () => {
	// ==========================================================================
	// Conversion Operations - fromHex
	// ==========================================================================

	describe("fromHex", () => {
		it("converts valid lowercase hex to Address", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("converts valid mixed case hex to Address", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("converts zero address", () => {
			const addr = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			expect(addr.every((b) => b === 0)).toBe(true);
		});

		it("converts max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			expect(addr.every((b) => b === 255)).toBe(true);
		});

		it("throws on missing 0x prefix", () => {
			expect(() =>
				Address.fromHex("742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toThrow(AddressNamespace.InvalidHexFormatError);
		});

		it("throws on invalid length", () => {
			expect(() => Address.fromHex("0x742d35cc")).toThrow(
				AddressNamespace.InvalidHexFormatError,
			);
			expect(() =>
				Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff"),
			).toThrow(AddressNamespace.InvalidHexFormatError);
		});

		it("throws on invalid hex characters", () => {
			expect(() =>
				Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251eZ"),
			).toThrow(AddressNamespace.InvalidHexStringError);
		});
	});

	// ==========================================================================
	// Conversion Operations - fromBase64
	// ==========================================================================

	describe("fromBase64", () => {
		it("converts valid base64 to Address", () => {
			// Base64 encoding of 20-byte address
			const base64 = "dC01zGY0wFMpJaO4RLyedZXyUeM="; // 0x742d35cc6634c0532925a3b844bc9e7595f251e3
			const addr = Address.fromBase64(base64);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
		});

		it("throws on base64 encoding 19 bytes", () => {
			// Base64 for 19 bytes
			const base64 = "dC01zGY0wFMpJaO4RLyedZXyUQ==";
			expect(() => Address.fromBase64(base64)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on base64 encoding 21 bytes", () => {
			// Base64 for 21 bytes
			const base64 = "dC01zGY0wFMpJaO4RLyedZXyUeMB";
			expect(() => Address.fromBase64(base64)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on base64 encoding 32 bytes", () => {
			// Base64 for 32 bytes
			const base64 = "dC01zGY0wFMpJaO4RLyedZXyUeMAAAAAAAAAAAAAAA==";
			expect(() => Address.fromBase64(base64)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});
	});

	// ==========================================================================
	// Conversion Operations - fromBytes
	// ==========================================================================

	describe("fromBytes", () => {
		it("creates Address from 20-byte array", () => {
			const bytes = new Uint8Array(20);
			bytes[0] = 0x74;
			bytes[1] = 0x2d;
			const addr = Address.fromBytes(bytes);
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
			expect(addr.length).toBe(20);
		});

		it("creates copy of input bytes", () => {
			const bytes = new Uint8Array(20);
			const addr = Address.fromBytes(bytes);
			bytes[0] = 0xff;
			expect(addr[0]).toBe(0);
		});

		it("throws on invalid length - 19 bytes", () => {
			expect(() => Address.fromBytes(new Uint8Array(19))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on invalid length - 21 bytes", () => {
			expect(() => Address.fromBytes(new Uint8Array(21))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on invalid length - 0 bytes", () => {
			expect(() => Address.fromBytes(new Uint8Array(0))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on invalid length - 32 bytes", () => {
			expect(() => Address.fromBytes(new Uint8Array(32))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});
	});

	// ==========================================================================
	// Conversion Operations - fromNumber
	// ==========================================================================

	describe("fromNumber", () => {
		it("converts bigint to Address", () => {
			const addr =
				Address.fromNumber(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
		});

		it("converts number to Address", () => {
			const addr = Address.fromNumber(12345);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
			expect(addr[19]).toBe(0x39);
			expect(addr[18]).toBe(0x30);
		});

		it("converts zero to zero address", () => {
			const addr = Address.fromNumber(0);
			expect(addr.every((b) => b === 0)).toBe(true);
		});

		it("takes lower 160 bits for large values", () => {
			const largeValue = (1n << 200n) | 0xffffn;
			const addr = Address.fromNumber(largeValue);
			expect(addr.length).toBe(20);
			expect(addr[18]).toBe(0xff);
			expect(addr[19]).toBe(0xff);
		});

		it("throws on negative bigint", () => {
			expect(() => Address.fromNumber(-1n)).toThrow(
				AddressNamespace.InvalidValueError,
			);
			expect(() => Address.fromNumber(-1000n)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on negative number", () => {
			expect(() => Address.fromNumber(-1)).toThrow(
				AddressNamespace.InvalidValueError,
			);
			expect(() => Address.fromNumber(-12345)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	// ==========================================================================
	// Conversion Operations - fromPublicKey
	// ==========================================================================

	describe("fromPublicKey", () => {
		it("derives address from public key", () => {
			// Test vector: known public key and derived address
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr = Address.fromPublicKey(x, y);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("produces deterministic address", () => {
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr1 = Address.fromPublicKey(x, y);
			const addr2 = Address.fromPublicKey(x, y);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Conversion Operations - toHex
	// ==========================================================================

	describe("toHex", () => {
		it("converts Address to lowercase hex", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const hex = Address.toHex(addr);
			expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("returns branded Hex type", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const hex: BrandedHex = Address.toHex(addr);
			expect(hex.startsWith("0x")).toBe(true);
		});

		it("converts zero address", () => {
			const addr = Address.zero();
			const hex = Address.toHex(addr);
			expect(hex).toBe("0x0000000000000000000000000000000000000000");
		});

		it("pads with zeros correctly", () => {
			const bytes = new Uint8Array(20);
			bytes[19] = 0x01;
			const addr = Address.fromBytes(bytes);
			const hex = Address.toHex(addr);
			expect(hex).toBe("0x0000000000000000000000000000000000000001");
		});
	});

	// ==========================================================================
	// Conversion Operations - toChecksummed
	// ==========================================================================

	describe("toChecksummed", () => {
		it("produces EIP-55 checksummed address", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = Address.toChecksummed(addr);
			// Verified against ethers.js v6.15.0 and EIP-55 spec
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("returns branded Checksummed type", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed.startsWith("0x")).toBe(true);
		});

		it("handles all lowercase address", () => {
			const addr = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const checksummed = Address.toChecksummed(addr);
			// Verified against ethers.js v6.15.0 and EIP-55 spec
			expect(checksummed).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
		});

		it("handles zero address", () => {
			const addr = Address.zero();
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0x0000000000000000000000000000000000000000");
		});

		it("is deterministic", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed1 = Address.toChecksummed(addr);
			const checksummed2 = Address.toChecksummed(addr);
			expect(checksummed1).toBe(checksummed2);
		});
	});

	// ==========================================================================
	// Conversion Operations - toU256
	// ==========================================================================

	describe("toU256", () => {
		it("converts Address to bigint", () => {
			const addr =
				Address.fromNumber(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
			const value = Address.toU256(addr);
			expect(value).toBe(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
		});

		it("converts zero address to 0n", () => {
			const addr = Address.zero();
			const value = Address.toU256(addr);
			expect(value).toBe(0n);
		});

		it("round-trips with fromNumber", () => {
			const original = 0x742d35cc6634c0532925a3b844bc9e7595f251e3n;
			const addr = Address.fromNumber(original);
			const value = Address.toU256(addr);
			expect(value).toBe(original);
		});
	});

	// ==========================================================================
	// Validation Operations
	// ==========================================================================

	describe("isZero", () => {
		it("returns true for zero address", () => {
			const addr = Address.zero();
			expect(Address.isZero(addr)).toBe(true);
		});

		it("returns false for non-zero address", () => {
			const addr = Address.fromNumber(1);
			expect(Address.isZero(addr)).toBe(false);
		});

		it("returns false if any byte is non-zero", () => {
			const bytes = new Uint8Array(20);
			bytes[10] = 1;
			const addr = Address.fromBytes(bytes);
			expect(Address.isZero(addr)).toBe(false);
		});
	});

	describe("equals", () => {
		it("returns true for identical addresses", () => {
			const addr1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr2 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("returns false for different addresses", () => {
			const addr1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("returns true for same instance", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(Address.equals(addr, addr)).toBe(true);
		});
	});

	describe("isValid", () => {
		it("validates correct hex with 0x prefix", () => {
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(true);
			expect(
				Address.isValid("0x0000000000000000000000000000000000000000"),
			).toBe(true);
			expect(
				Address.isValid("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
			).toBe(true);
		});

		it("validates correct hex without 0x prefix", () => {
			expect(Address.isValid("742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
				true,
			);
			expect(Address.isValid("0000000000000000000000000000000000000000")).toBe(
				true,
			);
		});

		it("rejects invalid formats", () => {
			expect(Address.isValid("0x742d35cc")).toBe(false);
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff"),
			).toBe(false);
			expect(Address.isValid("742d35cc")).toBe(false);
			expect(Address.isValid("")).toBe(false);
			expect(Address.isValid("not-an-address")).toBe(false);
		});

		it("rejects invalid characters", () => {
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251eZ"),
			).toBe(false);
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e "),
			).toBe(false);
		});
	});

	describe("isValidChecksum", () => {
		it("validates correct checksummed addresses", () => {
			// Verified against ethers.js v6.15.0 and EIP-55 spec
			expect(
				Address.isValidChecksum("0x742d35Cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(true);
			expect(
				Address.isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(true);
		});

		it("rejects incorrect checksums", () => {
			expect(
				Address.isValidChecksum("0x742d35cc6634C0532925a3b844Bc9e7595f251e3"),
			).toBe(false);
			expect(
				Address.isValidChecksum("0x742d35CC6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("rejects all lowercase", () => {
			expect(
				Address.isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("rejects all uppercase", () => {
			expect(
				Address.isValidChecksum("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("validates zero address", () => {
			expect(
				Address.isValidChecksum("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});

		it("rejects invalid address formats", () => {
			expect(Address.isValidChecksum("0x742d35cc")).toBe(false);
			expect(Address.isValidChecksum("not-an-address")).toBe(false);
		});
	});

	describe("is", () => {
		it("returns true for Address instances", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(Address.is(addr)).toBe(true);
		});

		it("returns false for non-Uint8Array", () => {
			expect(Address.is(null)).toBe(false);
			expect(Address.is(undefined)).toBe(false);
			expect(Address.is("0x742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
				false,
			);
			expect(Address.is(123)).toBe(false);
		});

		it("returns false for wrong length Uint8Array", () => {
			expect(Address.is(new Uint8Array(19))).toBe(false);
			expect(Address.is(new Uint8Array(21))).toBe(false);
			expect(Address.is(new Uint8Array(32))).toBe(false);
		});

		it("returns true for 20-byte Uint8Array", () => {
			expect(Address.is(new Uint8Array(20))).toBe(true);
		});
	});

	// ==========================================================================
	// Special Address Operations
	// ==========================================================================

	describe("zero", () => {
		it("creates zero address", () => {
			const addr = Address.zero();
			expect(addr.length).toBe(20);
			expect(addr.every((b) => b === 0)).toBe(true);
		});

		it("creates new instance each time", () => {
			const addr1 = Address.zero();
			const addr2 = Address.zero();
			expect(addr1).not.toBe(addr2);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Contract Address Calculation - CREATE
	// ==========================================================================

	describe("calculateCreateAddress", () => {
		it("calculates address for nonce 0 - known vector", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 0n);
			// Verified against ethers.js v6.15.0 getContractAddress()
			expect(Address.toHex(contractAddr)).toBe(
				"0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a",
			);
		});

		it("calculates address for nonce 1 - known vector", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 1n);
			// Verified against ethers.js v6.15.0 getContractAddress()
			expect(Address.toHex(contractAddr)).toBe(
				"0xc244efd33e63b31c1c5e15c17e31040318e68ffa",
			);
		});

		it("calculates address for nonce 2", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 2n);
			// Verified against ethers.js v6.15.0 getContractAddress()
			expect(Address.toHex(contractAddr)).toBe(
				"0xfc17cf067a73c2229a3b463e350143b77a3d8604",
			);
		});

		it("calculates address for nonce 3", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 3n);
			// Verified against ethers.js v6.15.0 getContractAddress()
			expect(Address.toHex(contractAddr)).toBe(
				"0xf0383434be7f79bf1cc399de5720ba73a248025c",
			);
		});

		it("produces deterministic addresses", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const addr1 = Address.calculateCreateAddress(deployer, 42n);
			const addr2 = Address.calculateCreateAddress(deployer, 42n);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("produces different addresses for different nonces", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const addr1 = Address.calculateCreateAddress(deployer, 1n);
			const addr2 = Address.calculateCreateAddress(deployer, 2n);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("produces different addresses for different deployers", () => {
			const deployer1 = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const deployer2 = Address.fromHex(
				"0x8ba1f109551bD432803012645Ac136c69b95Ee4D",
			);
			const addr1 = Address.calculateCreateAddress(deployer1, 0n);
			const addr2 = Address.calculateCreateAddress(deployer2, 0n);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles boundary nonce values", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const nonces = [0n, 1n, 127n, 128n, 255n, 256n, 65535n, 65536n];

			for (const nonce of nonces) {
				const addr = Address.calculateCreateAddress(deployer, nonce);
				expect(addr.length).toBe(20);
			}
		});

		it("handles large nonces", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const largeNonce = 16777215n; // 2^24 - 1
			const addr = Address.calculateCreateAddress(deployer, largeNonce);
			expect(addr.length).toBe(20);
		});

		it("handles zero address deployer", () => {
			const deployer = Address.zero();
			const addr1 = Address.calculateCreateAddress(deployer, 0n);
			const addr2 = Address.calculateCreateAddress(deployer, 1n);
			expect(addr1.length).toBe(20);
			expect(addr2.length).toBe(20);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles max address deployer", () => {
			const deployer = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const addr = Address.calculateCreateAddress(deployer, 0n);
			expect(addr.length).toBe(20);
		});

		it("produces different addresses for sequential nonces", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const addresses = [];

			for (let i = 0n; i < 10n; i++) {
				const addr = Address.calculateCreateAddress(deployer, i);
				addresses.push(addr);
			}

			// Check all addresses are unique
			for (let i = 0; i < addresses.length; i++) {
				for (let j = i + 1; j < addresses.length; j++) {
					expect(Address.equals(addresses[i]!, addresses[j]!)).toBe(false);
				}
			}
		});

		it("throws on negative nonce", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			expect(() => Address.calculateCreateAddress(deployer, -1n)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	// ==========================================================================
	// Contract Address Calculation - CREATE2
	// ==========================================================================

	describe("calculateCreate2Address", () => {
		it("calculates CREATE2 address with zero values", () => {
			const deployer = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			const salt = new Uint8Array(32);
			// Per EIP-1014 spec: initCode is 0x00 (one byte), not empty
			const initCode = new Uint8Array([0]);

			const addr = Address.calculateCreate2Address(deployer, salt, initCode);
			// Verified against EIP-1014 spec and ethers.js v6.15.0 getCreate2Address()
			expect(Address.toHex(addr)).toBe(
				"0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38",
			);
		});

		it("produces deterministic addresses", () => {
			const deployer = Address.fromHex(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			);
			const salt = new Uint8Array(32);
			salt[0] = 0x12;
			salt[1] = 0x34;
			const initCode = new Uint8Array(3);
			initCode[0] = 0xab;
			initCode[1] = 0xcd;
			initCode[2] = 0xef;

			const addr1 = Address.calculateCreate2Address(deployer, salt, initCode);
			const addr2 = Address.calculateCreate2Address(deployer, salt, initCode);

			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("throws on invalid salt length", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const invalidSalt = new Uint8Array(31);
			const initCode = new Uint8Array(0);

			expect(() =>
				Address.calculateCreate2Address(deployer, invalidSalt, initCode),
			).toThrow();
		});
	});

	// ==========================================================================
	// Comparison Operations
	// ==========================================================================

	describe("compare", () => {
		it("returns 0 for equal addresses", () => {
			const addr1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr2 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(Address.compare(addr1, addr2)).toBe(0);
		});

		it("returns -1 when first is less than second", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			expect(Address.compare(addr1, addr2)).toBe(-1);
		});

		it("returns 1 when first is greater than second", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			expect(Address.compare(addr1, addr2)).toBe(1);
		});

		it("can be used to sort addresses", () => {
			const addrs = [
				Address.fromNumber(3),
				Address.fromNumber(1),
				Address.fromNumber(2),
			];
			addrs.sort((a, b) => Address.compare(a, b));
			expect(Address.toU256(addrs[0]!)).toBe(1n);
			expect(Address.toU256(addrs[1]!)).toBe(2n);
			expect(Address.toU256(addrs[2]!)).toBe(3n);
		});
	});

	describe("lessThan", () => {
		it("returns true when first is less than second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(2);
			expect(Address.lessThan(addr1, addr2)).toBe(true);
		});

		it("returns false when first is equal to second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(1);
			expect(Address.lessThan(addr1, addr2)).toBe(false);
		});

		it("returns false when first is greater than second", () => {
			const addr1 = Address.fromNumber(2);
			const addr2 = Address.fromNumber(1);
			expect(Address.lessThan(addr1, addr2)).toBe(false);
		});
	});

	describe("greaterThan", () => {
		it("returns true when first is greater than second", () => {
			const addr1 = Address.fromNumber(2);
			const addr2 = Address.fromNumber(1);
			expect(Address.greaterThan(addr1, addr2)).toBe(true);
		});

		it("returns false when first is equal to second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(1);
			expect(Address.greaterThan(addr1, addr2)).toBe(false);
		});

		it("returns false when first is less than second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(2);
			expect(Address.greaterThan(addr1, addr2)).toBe(false);
		});
	});

	// ==========================================================================
	// Formatting Operations
	// ==========================================================================

	describe("toShortHex", () => {
		it("formats address with default lengths", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr);
			expect(short).toBe("0x742d35...51e3");
		});

		it("formats address with custom lengths", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr, 8, 6);
			// Takes last 6 characters from hex (excluding 0x prefix)
			expect(short).toBe("0x742d35cc...f251e3");
		});

		it("returns full address if lengths exceed 40", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr, 20, 20);
			expect(short).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});
	});

	// ==========================================================================
	// Universal Constructor
	// ==========================================================================

	describe("Address.from()", () => {
		it("creates Address from bigint", () => {
			const addr = Address.from(0x742d35cc6634c0532925a3b844bc9e7595f251e3n);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("creates Address from number", () => {
			const addr = Address.from(12345);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("creates Address from hex string", () => {
			const addr = Address.from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("creates Address from Uint8Array", () => {
			const bytes = new Uint8Array(20);
			const addr = Address.from(bytes);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("throws on negative number", () => {
			expect(() => Address.from(-1)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});

		it("throws on invalid hex string", () => {
			expect(() => Address.from("0x742d35cc")).toThrow(
				AddressNamespace.InvalidHexFormatError,
			);
		});

		it("throws on invalid Uint8Array length", () => {
			expect(() => Address.from(new Uint8Array(19))).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on unsupported type", () => {
			expect(() => Address.from(null as any)).toThrow(
				AddressNamespace.InvalidValueError,
			);
			expect(() => Address.from({} as any)).toThrow(
				AddressNamespace.InvalidValueError,
			);
		});
	});

	// ==========================================================================
	// Round-trip Tests
	// ==========================================================================

	describe("round-trip conversions", () => {
		it("fromHex -> toHex", () => {
			const original = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const addr = Address.fromHex(original);
			const result = Address.toHex(addr);
			expect(result).toBe(original);
		});

		it("fromNumber -> toU256", () => {
			const original = 0x742d35cc6634c0532925a3b844bc9e7595f251e3n;
			const addr = Address.fromNumber(original);
			const result = Address.toU256(addr);
			expect(result).toBe(original);
		});

		it("fromBytes -> toHex -> fromHex -> equals", () => {
			const original = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				original[i] = i * 10;
			}
			const addr1 = Address.fromBytes(original);
			const hex = Address.toHex(addr1);
			const addr2 = Address.fromHex(hex);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});
	});
});
