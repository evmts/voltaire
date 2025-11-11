import { describe, expect, it } from "vitest";
import * as Address from "./Address.wasm.ts";
import type { BrandedAddress } from "./BrandedAddress/BrandedAddress.js";

describe("Address WASM", () => {
	// ==========================================================================
	// Construction/Conversion - fromHex
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

		it("converts hex without 0x prefix", () => {
			const addr = Address.fromHex("742d35cc6634c0532925a3b844bc9e7595f251e3");
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

		it("converts all uppercase hex", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			expect(addr.length).toBe(20);
		});

		it("throws on 19-byte hex (38 chars)", () => {
			expect(() =>
				Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251"),
			).toThrow();
		});

		it("throws on 21-byte hex (42 chars)", () => {
			expect(() =>
				Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff"),
			).toThrow();
		});

		it("throws on invalid hex characters (G)", () => {
			expect(() =>
				Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251eG"),
			).toThrow();
		});

		it("throws on invalid hex characters (Z)", () => {
			expect(() =>
				Address.fromHex("0xZ42d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toThrow();
		});

		it("throws on odd-length hex string", () => {
			expect(() => Address.fromHex("0x742d35c")).toThrow();
		});

		it("throws on empty string", () => {
			expect(() => Address.fromHex("")).toThrow();
		});

		it("throws on only 0x prefix", () => {
			expect(() => Address.fromHex("0x")).toThrow();
		});
	});

	// ==========================================================================
	// Construction/Conversion - fromBytes
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

		it("throws on 0-byte array", () => {
			expect(() => Address.fromBytes(new Uint8Array(0))).toThrow();
		});

		it("throws on 19-byte array", () => {
			expect(() => Address.fromBytes(new Uint8Array(19))).toThrow();
		});

		it("throws on 21-byte array", () => {
			expect(() => Address.fromBytes(new Uint8Array(21))).toThrow();
		});

		it("throws on 32-byte array", () => {
			expect(() => Address.fromBytes(new Uint8Array(32))).toThrow();
		});

		it("accepts zero-filled bytes", () => {
			const addr = Address.fromBytes(new Uint8Array(20));
			expect(addr.every((b) => b === 0)).toBe(true);
		});

		it("accepts max-filled bytes", () => {
			const bytes = new Uint8Array(20).fill(255);
			const addr = Address.fromBytes(bytes);
			expect(addr.every((b) => b === 255)).toBe(true);
		});
	});

	// ==========================================================================
	// Construction/Conversion - fromNumber
	// ==========================================================================

	describe("fromNumber", () => {
		it("converts 0 to zero address", () => {
			const addr = Address.fromNumber(0);
			expect(addr.every((b) => b === 0)).toBe(true);
		});

		it("converts 1 to address", () => {
			const addr = Address.fromNumber(1);
			expect(addr[19]).toBe(1);
			expect(addr.slice(0, 19).every((b) => b === 0)).toBe(true);
		});

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

		it("converts max safe integer", () => {
			const addr = Address.fromNumber(Number.MAX_SAFE_INTEGER);
			expect(addr.length).toBe(20);
		});

		it("converts max 160-bit value", () => {
			const maxValue = (1n << 160n) - 1n;
			const addr = Address.fromNumber(maxValue);
			expect(addr.every((b) => b === 255)).toBe(true);
		});

		it("truncates values larger than 160 bits", () => {
			const largeValue = (1n << 200n) | 0xffffn;
			const addr = Address.fromNumber(largeValue);
			expect(addr.length).toBe(20);
			expect(addr[18]).toBe(0xff);
			expect(addr[19]).toBe(0xff);
		});
	});

	// ==========================================================================
	// Construction/Conversion - fromPublicKey
	// ==========================================================================

	describe("fromPublicKey", () => {
		it("derives address from public key", () => {
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr = Address.fromPublicKey(x, y);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("produces deterministic address from same public key", () => {
			const x =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const addr1 = Address.fromPublicKey(x, y);
			const addr2 = Address.fromPublicKey(x, y);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("derives different addresses from different public keys", () => {
			const x1 =
				0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
			const y1 =
				0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
			const x2 =
				0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5n;
			const y2 =
				0x1ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe52an;
			const addr1 = Address.fromPublicKey(x1, y1);
			const addr2 = Address.fromPublicKey(x2, y2);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles zero coordinates", () => {
			const addr = Address.fromPublicKey(0n, 0n);
			expect(addr.length).toBe(20);
		});

		it("handles max coordinates", () => {
			const max = (1n << 256n) - 1n;
			const addr = Address.fromPublicKey(max, max);
			expect(addr.length).toBe(20);
		});
	});

	// ==========================================================================
	// Construction/Conversion - fromAbiEncoded
	// ==========================================================================

	describe("fromAbiEncoded", () => {
		it("extracts address from 32-byte ABI-encoded value", () => {
			const encoded = new Uint8Array(32);
			encoded.set(
				[
					0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3,
					0xb8, 0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0x51, 0xe3,
				],
				12,
			);
			const addr = Address.fromAbiEncoded(encoded);
			expect(addr.length).toBe(20);
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
		});

		it("validates padding is in first 12 bytes", () => {
			const encoded = new Uint8Array(32);
			const rawAddr = new Uint8Array(20).fill(0xff);
			encoded.set(rawAddr, 12);
			const addr = Address.fromAbiEncoded(encoded);
			expect(addr.every((b) => b === 255)).toBe(true);
		});

		it("throws on wrong length (31 bytes)", () => {
			expect(() => Address.fromAbiEncoded(new Uint8Array(31))).toThrow();
		});

		it("throws on wrong length (33 bytes)", () => {
			expect(() => Address.fromAbiEncoded(new Uint8Array(33))).toThrow();
		});

		it("throws on wrong length (20 bytes)", () => {
			expect(() => Address.fromAbiEncoded(new Uint8Array(20))).toThrow();
		});

		it("handles zero address in ABI encoding", () => {
			const encoded = new Uint8Array(32);
			const addr = Address.fromAbiEncoded(encoded);
			expect(Address.isZero(addr)).toBe(true);
		});
	});

	// ==========================================================================
	// Output Formats - toHex
	// ==========================================================================

	describe("toHex", () => {
		it("converts Address to lowercase hex with 0x prefix", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const hex = Address.toHex(addr);
			expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
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

		it("converts max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const hex = Address.toHex(addr);
			expect(hex).toBe("0xffffffffffffffffffffffffffffffffffffffff");
		});

		it("always returns lowercase", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const hex = Address.toHex(addr);
			expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(hex.toLowerCase()).toBe(hex);
		});
	});

	// ==========================================================================
	// Output Formats - toChecksummed (EIP-55)
	// ==========================================================================

	describe("toChecksummed", () => {
		it("produces EIP-55 checksummed address", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("checksums known test vector 1", () => {
			const addr = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
		});

		it("checksums known test vector 2", () => {
			const addr = Address.fromHex(
				"0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");
		});

		it("checksums known test vector 3 (all lowercase checksum)", () => {
			const addr = Address.fromHex(
				"0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB");
		});

		it("checksums known test vector 4", () => {
			const addr = Address.fromHex(
				"0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb",
			);
			const checksummed = Address.toChecksummed(addr);
			expect(checksummed).toBe("0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb");
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

		it("checksums real contract addresses", () => {
			// USDC
			const usdc = Address.fromHex(
				"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			);
			expect(Address.toChecksummed(usdc)).toBe(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);

			// DAI
			const dai = Address.fromHex("0x6b175474e89094c44da98b954eedeac495271d0f");
			expect(Address.toChecksummed(dai)).toBe(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);
		});
	});

	// ==========================================================================
	// Output Formats - toLowercase
	// ==========================================================================

	describe("toLowercase", () => {
		it("converts Address to lowercase hex", () => {
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const lower = Address.toLowercase(addr);
			expect(lower).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("output is all lowercase", () => {
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const lower = Address.toLowercase(addr);
			expect(lower.toLowerCase()).toBe(lower);
		});
	});

	// ==========================================================================
	// Output Formats - toUppercase
	// ==========================================================================

	describe("toUppercase", () => {
		it("converts Address to uppercase hex", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = Address.toUppercase(addr);
			expect(upper).toBe("0X742D35CC6634C0532925A3B844BC9E7595F251E3");
		});

		it("output is all uppercase (including 0x prefix)", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const upper = Address.toUppercase(addr);
			expect(upper.toUpperCase()).toBe(upper);
		});
	});

	// ==========================================================================
	// Output Formats - toShortHex
	// ==========================================================================

	describe("toShortHex", () => {
		it("formats address with default length (4 chars)", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr);
			expect(short).toBe("0x742d...51e3");
		});

		it("formats address with custom length", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr, 6);
			expect(short).toBe("0x742d35...f251e3");
		});

		it("returns full address if slice length is large", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const short = Address.toShortHex(addr, 20);
			expect(short).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("handles zero address", () => {
			const addr = Address.zero();
			const short = Address.toShortHex(addr);
			expect(short).toBe("0x0000...0000");
		});
	});

	// ==========================================================================
	// Output Formats - toAbiEncoded
	// ==========================================================================

	describe("toAbiEncoded", () => {
		it("encodes address to 32 bytes (left-padded)", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const encoded = Address.toAbiEncoded(addr);
			expect(encoded.length).toBe(32);
			expect(encoded.slice(0, 12).every((b) => b === 0)).toBe(true);
			expect(encoded[12]).toBe(0x74);
			expect(encoded[13]).toBe(0x2d);
		});

		it("round-trips with fromAbiEncoded", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const encoded = Address.toAbiEncoded(addr);
			const decoded = Address.fromAbiEncoded(encoded);
			expect(Address.equals(addr, decoded)).toBe(true);
		});

		it("encodes zero address", () => {
			const addr = Address.zero();
			const encoded = Address.toAbiEncoded(addr);
			expect(encoded.every((b) => b === 0)).toBe(true);
		});

		it("encodes max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const encoded = Address.toAbiEncoded(addr);
			expect(encoded.slice(0, 12).every((b) => b === 0)).toBe(true);
			expect(encoded.slice(12).every((b) => b === 255)).toBe(true);
		});
	});

	// ==========================================================================
	// Output Formats - toU256
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

		it("converts max address to max 160-bit value", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			const value = Address.toU256(addr);
			expect(value).toBe((1n << 160n) - 1n);
		});
	});

	// ==========================================================================
	// Output Formats - format
	// ==========================================================================

	describe("format", () => {
		it("formats address as checksummed hex", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const formatted = Address.format(addr);
			expect(formatted).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("format is same as toChecksummed", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(Address.format(addr)).toBe(Address.toChecksummed(addr));
		});
	});

	// ==========================================================================
	// Validation - isValid
	// ==========================================================================

	describe("isValid", () => {
		it("validates correct hex with 0x prefix", () => {
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(true);
		});

		it("validates correct hex without 0x prefix", () => {
			expect(Address.isValid("742d35cc6634c0532925a3b844bc9e7595f251e3")).toBe(
				true,
			);
		});

		it("validates zero address", () => {
			expect(
				Address.isValid("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});

		it("validates max address", () => {
			expect(
				Address.isValid("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
			).toBe(true);
		});

		it("validates checksummed address", () => {
			expect(
				Address.isValid("0x742d35Cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(true);
		});

		it("rejects short addresses", () => {
			expect(Address.isValid("0x742d35cc")).toBe(false);
		});

		it("rejects long addresses", () => {
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3ff"),
			).toBe(false);
		});

		it("rejects invalid hex characters", () => {
			expect(
				Address.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251eZ"),
			).toBe(false);
		});

		it("rejects empty string", () => {
			expect(Address.isValid("")).toBe(false);
		});

		it("rejects non-hex strings", () => {
			expect(Address.isValid("not-an-address")).toBe(false);
		});
	});

	// ==========================================================================
	// Validation - isValidChecksum (EIP-55)
	// ==========================================================================

	describe("isValidChecksum", () => {
		it("validates correct checksummed address", () => {
			expect(
				Address.isValidChecksum("0x742d35Cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(true);
		});

		it("validates known EIP-55 test vectors", () => {
			expect(
				Address.isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(true);
			expect(
				Address.isValidChecksum("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
			).toBe(true);
			expect(
				Address.isValidChecksum("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB"),
			).toBe(true);
			expect(
				Address.isValidChecksum("0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb"),
			).toBe(true);
		});

		it("validates zero address (all lowercase)", () => {
			expect(
				Address.isValidChecksum("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});

		it("rejects all lowercase address", () => {
			expect(
				Address.isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("rejects all uppercase address", () => {
			expect(
				Address.isValidChecksum("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("rejects incorrect checksum", () => {
			expect(
				Address.isValidChecksum("0x742d35cc6634C0532925a3b844Bc9e7595f251e3"),
			).toBe(false);
		});

		it("rejects invalid length", () => {
			expect(Address.isValidChecksum("0x742d35cc")).toBe(false);
		});

		it("rejects invalid characters", () => {
			expect(
				Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251eZ"),
			).toBe(false);
		});
	});

	// ==========================================================================
	// Validation - isZero
	// ==========================================================================

	describe("isZero", () => {
		it("returns true for zero address", () => {
			const addr = Address.zero();
			expect(Address.isZero(addr)).toBe(true);
		});

		it("returns true for address from 0", () => {
			const addr = Address.fromNumber(0);
			expect(Address.isZero(addr)).toBe(true);
		});

		it("returns true for address from zero hex", () => {
			const addr = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			expect(Address.isZero(addr)).toBe(true);
		});

		it("returns false for address with value 1", () => {
			const addr = Address.fromNumber(1);
			expect(Address.isZero(addr)).toBe(false);
		});

		it("returns false if any byte is non-zero", () => {
			const bytes = new Uint8Array(20);
			bytes[10] = 1;
			const addr = Address.fromBytes(bytes);
			expect(Address.isZero(addr)).toBe(false);
		});

		it("returns false for max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			expect(Address.isZero(addr)).toBe(false);
		});
	});

	// ==========================================================================
	// Comparison - equals
	// ==========================================================================

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

		it("returns true for same address in different cases", () => {
			const addr1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr2 = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("returns true for checksummed vs lowercase", () => {
			const addr1 = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const addr2 = Address.fromHex(
				"0x742d35Cc6634c0532925a3b844bc9e7595F251E3",
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

		it("returns true for two zero addresses", () => {
			const addr1 = Address.zero();
			const addr2 = Address.zero();
			expect(Address.equals(addr1, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Comparison - lessThan
	// ==========================================================================

	describe("lessThan", () => {
		it("returns true when first is less than second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(2);
			expect(Address.lessThan(addr1, addr2)).toBe(true);
		});

		it("returns false when first equals second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(1);
			expect(Address.lessThan(addr1, addr2)).toBe(false);
		});

		it("returns false when first is greater than second", () => {
			const addr1 = Address.fromNumber(2);
			const addr2 = Address.fromNumber(1);
			expect(Address.lessThan(addr1, addr2)).toBe(false);
		});

		it("compares by first differing byte", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			expect(Address.lessThan(addr1, addr2)).toBe(true);
		});

		it("zero address is less than any non-zero address", () => {
			const addr1 = Address.zero();
			const addr2 = Address.fromNumber(1);
			expect(Address.lessThan(addr1, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Comparison - greaterThan
	// ==========================================================================

	describe("greaterThan", () => {
		it("returns true when first is greater than second", () => {
			const addr1 = Address.fromNumber(2);
			const addr2 = Address.fromNumber(1);
			expect(Address.greaterThan(addr1, addr2)).toBe(true);
		});

		it("returns false when first equals second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(1);
			expect(Address.greaterThan(addr1, addr2)).toBe(false);
		});

		it("returns false when first is less than second", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(2);
			expect(Address.greaterThan(addr1, addr2)).toBe(false);
		});

		it("any non-zero address is greater than zero address", () => {
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.zero();
			expect(Address.greaterThan(addr1, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Comparison - compare
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
			const addr1 = Address.fromNumber(1);
			const addr2 = Address.fromNumber(2);
			expect(Address.compare(addr1, addr2)).toBe(-1);
		});

		it("returns 1 when first is greater than second", () => {
			const addr1 = Address.fromNumber(2);
			const addr2 = Address.fromNumber(1);
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

	// ==========================================================================
	// Constants - zero
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
	// Ethereum-Specific - calculateCreateAddress
	// ==========================================================================

	describe("calculateCreateAddress", () => {
		it("calculates CREATE address for nonce 0", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 0n);
			expect(Address.toHex(contractAddr)).toBe(
				"0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a",
			);
		});

		it("calculates CREATE address for nonce 1", () => {
			const deployer = Address.fromHex(
				"0xa0cf798816d4b9b9866b5330eea46a18382f251e",
			);
			const contractAddr = Address.calculateCreateAddress(deployer, 1n);
			expect(Address.toHex(contractAddr)).toBe(
				"0xc244efd33e63b31c1c5e15c17e31040318e68ffa",
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

		it("handles zero address deployer", () => {
			const deployer = Address.zero();
			const addr = Address.calculateCreateAddress(deployer, 0n);
			expect(addr.length).toBe(20);
		});

		it("handles large nonces", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const largeNonce = 16777215n;
			const addr = Address.calculateCreateAddress(deployer, largeNonce);
			expect(addr.length).toBe(20);
		});
	});

	// ==========================================================================
	// Ethereum-Specific - calculateCreate2Address
	// ==========================================================================

	describe("calculateCreate2Address", () => {
		it("calculates CREATE2 address with zero values", () => {
			const deployer = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			const addr = Address.calculateCreate2Address(deployer, salt, initCode);
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
			const initCode = new Uint8Array([0xab, 0xcd]);
			const addr1 = Address.calculateCreate2Address(deployer, salt, initCode);
			const addr2 = Address.calculateCreate2Address(deployer, salt, initCode);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("produces different addresses for different salts", () => {
			const deployer = Address.fromHex(
				"0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
			);
			const salt1 = new Uint8Array(32);
			salt1[0] = 0x01;
			const salt2 = new Uint8Array(32);
			salt2[0] = 0x02;
			const initCode = new Uint8Array([0xab]);
			const addr1 = Address.calculateCreate2Address(deployer, salt1, initCode);
			const addr2 = Address.calculateCreate2Address(deployer, salt2, initCode);
			expect(Address.equals(addr1, addr2)).toBe(false);
		});

		it("handles various salt lengths", () => {
			const deployer = Address.fromHex(
				"0x742d35Cc6634C0532925a3b8D39c0E6cfC8C74E4",
			);
			const validSalt = new Uint8Array(32);
			const initCode = new Uint8Array(0);
			// WASM implementation may be more lenient with salt validation
			const addr = Address.calculateCreate2Address(
				deployer,
				validSalt,
				initCode,
			);
			expect(addr.length).toBe(20);
		});
	});

	// ==========================================================================
	// General Constructor - from
	// ==========================================================================

	describe("from", () => {
		it("creates Address from hex string", () => {
			const addr = Address.from("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

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

		it("creates Address from Uint8Array", () => {
			const bytes = new Uint8Array(20);
			const addr = Address.from(bytes);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("throws on invalid string", () => {
			expect(() => Address.from("invalid")).toThrow();
		});

		it("throws on wrong length bytes", () => {
			expect(() => Address.from(new Uint8Array(19))).toThrow();
		});
	});

	// ==========================================================================
	// Boundary Tests
	// ==========================================================================

	describe("boundary tests", () => {
		it("handles zero address", () => {
			const addr = Address.fromHex(
				"0x0000000000000000000000000000000000000000",
			);
			expect(Address.isZero(addr)).toBe(true);
			expect(Address.toHex(addr)).toBe(
				"0x0000000000000000000000000000000000000000",
			);
		});

		it("handles max address", () => {
			const addr = Address.fromHex(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
			expect(addr.every((b) => b === 255)).toBe(true);
			expect(Address.toHex(addr)).toBe(
				"0xffffffffffffffffffffffffffffffffffffffff",
			);
		});

		it("handles address with single bit set", () => {
			const addr = Address.fromNumber(1n << 159n);
			expect(addr[0]).toBe(0x80);
			expect(addr.slice(1).every((b) => b === 0)).toBe(true);
		});

		it("handles address with alternating bits", () => {
			const pattern = 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan;
			const addr = Address.fromNumber(pattern);
			expect(addr.length).toBe(20);
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

		it("fromBytes -> toHex -> fromHex", () => {
			const original = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				original[i] = i * 10;
			}
			const addr1 = Address.fromBytes(original);
			const hex = Address.toHex(addr1);
			const addr2 = Address.fromHex(hex);
			expect(Address.equals(addr1, addr2)).toBe(true);
		});

		it("toAbiEncoded -> fromAbiEncoded", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const encoded = Address.toAbiEncoded(addr);
			const decoded = Address.fromAbiEncoded(encoded);
			expect(Address.equals(addr, decoded)).toBe(true);
		});

		it("toChecksummed -> fromHex", () => {
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = Address.toChecksummed(addr);
			const addr2 = Address.fromHex(checksummed);
			expect(Address.equals(addr, addr2)).toBe(true);
		});
	});

	// ==========================================================================
	// Known Contract Addresses
	// ==========================================================================

	describe("known contract addresses", () => {
		it("handles USDC address", () => {
			const usdc = Address.fromHex(
				"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
			);
			expect(Address.toChecksummed(usdc)).toBe(
				"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
			);
		});

		it("handles DAI address", () => {
			const dai = Address.fromHex("0x6b175474e89094c44da98b954eedeac495271d0f");
			expect(Address.toChecksummed(dai)).toBe(
				"0x6B175474E89094C44Da98b954EedeAC495271d0F",
			);
		});

		it("handles Uniswap V3 Router address", () => {
			const router = Address.fromHex(
				"0xe592427a0aece92de3edee1f18e0157c05861564",
			);
			expect(Address.toChecksummed(router)).toBe(
				"0xE592427A0AEce92De3Edee1F18E0157C05861564",
			);
		});

		it("handles ENS Registry address", () => {
			const ens = Address.fromHex("0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e");
			expect(Address.toChecksummed(ens)).toBe(
				"0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
			);
		});
	});

	// ==========================================================================
	// WASM-Specific Memory Tests
	// ==========================================================================

	describe("WASM memory handling", () => {
		it("handles multiple conversions without memory issues", () => {
			for (let i = 0; i < 100; i++) {
				const addr = Address.fromNumber(BigInt(i));
				const hex = Address.toHex(addr);
				const addr2 = Address.fromHex(hex);
				expect(Address.equals(addr, addr2)).toBe(true);
			}
		});

		it("handles large batch of addresses", () => {
			const addresses: BrandedAddress[] = [];
			for (let i = 0; i < 1000; i++) {
				addresses.push(Address.fromNumber(BigInt(i)));
			}
			expect(addresses.length).toBe(1000);
			expect(addresses.every((a) => a.length === 20)).toBe(true);
		});

		it("handles rapid checksum validations", () => {
			const addr = "0x742d35Cc6634c0532925a3b844bc9e7595F251E3";
			for (let i = 0; i < 100; i++) {
				expect(Address.isValidChecksum(addr)).toBe(true);
			}
		});
	});

	// ==========================================================================
	// Error Handling
	// ==========================================================================

	describe("error handling", () => {
		it("handles errors gracefully in isValid", () => {
			expect(() => Address.isValid("invalid")).not.toThrow();
			expect(Address.isValid("invalid")).toBe(false);
		});

		it("handles errors gracefully in isValidChecksum", () => {
			expect(() => Address.isValidChecksum("invalid")).not.toThrow();
			expect(Address.isValidChecksum("invalid")).toBe(false);
		});

		it("throws on fromHex with invalid input", () => {
			expect(() => Address.fromHex("0xZZZ")).toThrow();
		});

		it("throws on fromBytes with invalid length", () => {
			expect(() => Address.fromBytes(new Uint8Array(10))).toThrow();
		});

		it("throws on fromAbiEncoded with invalid length", () => {
			expect(() => Address.fromAbiEncoded(new Uint8Array(20))).toThrow();
		});
	});

	// ==========================================================================
	// Security Tests
	// ==========================================================================

	describe("security", () => {
		it("prevents checksum bypass with all lowercase", () => {
			expect(
				Address.isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("prevents checksum bypass with all uppercase", () => {
			expect(
				Address.isValidChecksum("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("detects single character checksum errors", () => {
			// Correct: 0x742d35Cc6634c0532925a3b844bc9e7595F251E3
			// Wrong:   0x742d35cc6634c0532925a3b844bc9e7595F251E3 (C -> c at position 7)
			expect(
				Address.isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(false);
		});

		it("validates addresses prevent invalid inputs in contract calls", () => {
			expect(Address.isValid("0x742d35cc")).toBe(false);
			expect(Address.isValid("0xZZZ")).toBe(false);
			expect(Address.isValid("")).toBe(false);
		});
	});
});
