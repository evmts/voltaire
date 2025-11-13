import { describe, expect, it } from "vitest";
import { Address } from "./index.js";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { encode as rlpEncode } from "../Rlp/BrandedRlp/encode.js";

describe("Address Class API - Conditional Crypto Methods", () => {
	// ==========================================================================
	// Base Address (No Crypto)
	// ==========================================================================

	describe("Base Address (no crypto)", () => {
		it("creates Address without crypto", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("supports all non-crypto methods", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr.toHex()).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr.toLowercase()).toBe(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(addr.toUppercase()).toBe(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			expect(addr.isZero()).toBe(false);
			expect(addr.toU256()).toBeTypeOf("bigint");
		});

		it("throws on toChecksummed without crypto", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(() => addr.toChecksummed()).toThrow(
				"keccak256 not provided to Address constructor",
			);
		});

		it("throws on calculateCreateAddress without crypto", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(() => addr.calculateCreateAddress(0n)).toThrow(
				"keccak256 not provided to Address constructor",
			);
		});

		it("throws on calculateCreate2Address without crypto", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			expect(() => addr.calculateCreate2Address(salt, initCode)).toThrow(
				"keccak256 not provided to Address constructor",
			);
		});
	});

	// ==========================================================================
	// Address with Keccak256
	// ==========================================================================

	describe("Address with keccak256", () => {
		it("creates Address with keccak256", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
			});
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("enables toChecksummed", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
			});
			const checksummed = addr.toChecksummed();
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("enables calculateCreate2Address", () => {
			const addr = Address("0x0000000000000000000000000000000000000000", {
				keccak256,
			});
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			const contractAddr = addr.calculateCreate2Address(salt, initCode);
			expect(contractAddr.toHex()).toBe(
				"0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38",
			);
		});

		it("throws on calculateCreateAddress without rlpEncode", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
			});
			expect(() => addr.calculateCreateAddress(0n)).toThrow(
				"rlpEncode not provided to Address constructor",
			);
		});

		it("clone preserves crypto dependencies", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
			});
			const cloned = addr.clone();
			const checksummed = cloned.toChecksummed();
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("calculateCreate2Address result preserves crypto", () => {
			const addr = Address("0x0000000000000000000000000000000000000000", {
				keccak256,
			});
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			const contractAddr = addr.calculateCreate2Address(salt, initCode);
			const checksummed = contractAddr.toChecksummed();
			expect(checksummed).toBe("0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38");
		});
	});

	// ==========================================================================
	// Address with Full Crypto
	// ==========================================================================

	describe("Address with full crypto", () => {
		it("creates Address with keccak256 and rlpEncode", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
				rlpEncode,
			});
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("enables toChecksummed", () => {
			const addr = Address("0x742d35cc6634c0532925a3b844bc9e7595f251e3", {
				keccak256,
				rlpEncode,
			});
			const checksummed = addr.toChecksummed();
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("enables calculateCreateAddress", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			const contractAddr = addr.calculateCreateAddress(0n);
			expect(contractAddr.toHex()).toBe(
				"0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a",
			);
		});

		it("enables calculateCreate2Address", () => {
			const addr = Address("0x0000000000000000000000000000000000000000", {
				keccak256,
				rlpEncode,
			});
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			const contractAddr = addr.calculateCreate2Address(salt, initCode);
			expect(contractAddr.toHex()).toBe(
				"0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38",
			);
		});

		it("clone preserves crypto dependencies", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			const cloned = addr.clone();
			const contractAddr = cloned.calculateCreateAddress(0n);
			expect(contractAddr.toHex()).toBe(
				"0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a",
			);
		});

		it("calculateCreateAddress result preserves crypto", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			const contractAddr = addr.calculateCreateAddress(0n);
			const checksummed = contractAddr.toChecksummed();
			expect(checksummed).toBe("0xfA0D70e1D133B2F6CF2777547e8b12810d31B69a");
		});

		it("calculateCreate2Address result preserves crypto", () => {
			const addr = Address("0x0000000000000000000000000000000000000000", {
				keccak256,
				rlpEncode,
			});
			const salt = new Uint8Array(32);
			const initCode = new Uint8Array([0]);
			const contractAddr = addr.calculateCreate2Address(salt, initCode);
			const checksummed = contractAddr.toChecksummed();
			expect(checksummed).toBe("0x4D1A2e2bB4F88F0250f26Ffff098B0b30B26BF38");
		});
	});

	// ==========================================================================
	// Edge Cases
	// ==========================================================================

	describe("Edge cases", () => {
		it("handles multiple sequential operations", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			const addr1 = addr.calculateCreateAddress(0n);
			const addr2 = addr.calculateCreateAddress(1n);
			const addr3 = addr.calculateCreateAddress(2n);
			expect(addr1.toHex()).toBe("0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a");
			expect(addr2.toHex()).toBe("0xc244efd33e63b31c1c5e15c17e31040318e68ffa");
			expect(addr3.toHex()).toBe("0xfc17cf067a73c2229a3b463e350143b77a3d8604");
		});

		it("supports method chaining with crypto", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			const result = addr.calculateCreateAddress(0n).toChecksummed();
			expect(result).toBe("0xfA0D70e1D133B2F6CF2777547e8b12810d31B69a");
		});

		it("validates nonce in calculateCreateAddress", () => {
			const addr = Address("0xa0cf798816d4b9b9866b5330eea46a18382f251e", {
				keccak256,
				rlpEncode,
			});
			expect(() => addr.calculateCreateAddress(-1n)).toThrow(
				"Nonce cannot be negative",
			);
		});
	});
});
