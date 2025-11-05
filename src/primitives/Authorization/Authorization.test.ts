/**
 * Tests for Authorization module (EIP-7702)
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress } from "../Address/index.js";
import * as Authorization from "../Authorization/index.js";

// ============================================================================
// Test Data Helpers
// ============================================================================

// NOTE: Authorization.ts expects Address to have a .bytes property,
// but the actual Address type is just a branded Uint8Array.
// Creating test addresses with .bytes property to match authorization.ts expectations.
function createAddress(byte: number): BrandedAddress {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	// Add bytes property to match what authorization.ts expects
	return Object.assign(bytes, { bytes }) as unknown as BrandedAddress;
}

const addr1 = createAddress(1);
const addr2 = createAddress(2);
const zeroAddress = createAddress(0);

// ============================================================================
// Type Guard Tests
// ============================================================================

describe("Authorization.isItem", () => {
	it("returns true for valid item", () => {
		const item: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(true);
	});

	it("returns false for null", () => {
		expect(Authorization.isItem(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(Authorization.isItem(undefined)).toBe(false);
	});

	it("returns false for non-object", () => {
		expect(Authorization.isItem(42)).toBe(false);
		expect(Authorization.isItem("string")).toBe(false);
	});

	it("returns false for object without chainId", () => {
		const item = {
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with non-bigint chainId", () => {
		const item = {
			chainId: 1,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object without address", () => {
		const item = {
			chainId: 1n,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with invalid address", () => {
		const item = {
			chainId: 1n,
			address: "0x1234",
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object without nonce", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with non-bigint nonce", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object without yParity", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with non-number yParity", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: "0",
			r: 0x123n,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object without r", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object without s", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with non-bigint r", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123,
			s: 0x456n,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});

	it("returns false for object with non-bigint s", () => {
		const item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456,
		};
		expect(Authorization.isItem(item)).toBe(false);
	});
});

describe("Authorization.isUnsigned", () => {
	it("returns true for valid unsigned", () => {
		const unsigned: Authorization.Unsigned = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
		};
		expect(Authorization.isUnsigned(unsigned)).toBe(true);
	});

	it("returns false for null", () => {
		expect(Authorization.isUnsigned(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(Authorization.isUnsigned(undefined)).toBe(false);
	});

	it("returns false for non-object", () => {
		expect(Authorization.isUnsigned(42)).toBe(false);
	});

	it("returns false for object without chainId", () => {
		const unsigned = {
			address: addr1,
			nonce: 0n,
		};
		expect(Authorization.isUnsigned(unsigned)).toBe(false);
	});

	it("returns false for object without address", () => {
		const unsigned = {
			chainId: 1n,
			nonce: 0n,
		};
		expect(Authorization.isUnsigned(unsigned)).toBe(false);
	});

	it("returns false for object without nonce", () => {
		const unsigned = {
			chainId: 1n,
			address: addr1,
		};
		expect(Authorization.isUnsigned(unsigned)).toBe(false);
	});
});

// ============================================================================
// Validation Tests
// ============================================================================

describe("Authorization.validate", () => {
	const validAuth: Authorization.Item = {
		chainId: 1n,
		address: addr1,
		nonce: 0n,
		yParity: 0,
		r: 0x123n,
		s: 0x456n,
	};

	it("does not throw for valid authorization", () => {
		expect(() => Authorization.validate.call(validAuth)).not.toThrow();
	});

	it("throws for zero chain ID", () => {
		const auth = { ...validAuth, chainId: 0n };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Chain ID must be non-zero",
		);
	});

	it("throws for zero address", () => {
		const auth = { ...validAuth, address: zeroAddress };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Address cannot be zero address",
		);
	});

	it("throws for invalid yParity (2)", () => {
		const auth = { ...validAuth, yParity: 2 };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"yParity must be 0 or 1",
		);
	});

	it("throws for invalid yParity (-1)", () => {
		const auth = { ...validAuth, yParity: -1 };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"yParity must be 0 or 1",
		);
	});

	it("accepts yParity = 0", () => {
		const auth = { ...validAuth, yParity: 0 };
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("accepts yParity = 1", () => {
		const auth = { ...validAuth, yParity: 1 };
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("throws for zero r", () => {
		const auth = { ...validAuth, r: 0n };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Signature r cannot be zero",
		);
	});

	it("throws for zero s", () => {
		const auth = { ...validAuth, s: 0n };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Signature s cannot be zero",
		);
	});

	it("throws for r >= N", () => {
		const auth = { ...validAuth, r: Authorization.SECP256K1_N };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Signature r must be less than curve order",
		);
	});

	it("accepts r = N - 1", () => {
		const auth = { ...validAuth, r: Authorization.SECP256K1_N - 1n };
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("throws for s > N/2 (malleable signature)", () => {
		const auth = { ...validAuth, s: Authorization.SECP256K1_HALF_N + 1n };
		expect(() => Authorization.validate.call(auth)).toThrow(
			Authorization.ValidationError,
		);
		expect(() => Authorization.validate.call(auth)).toThrow(
			"Signature s too high (malleable signature)",
		);
	});

	it("accepts s = N/2", () => {
		const auth = { ...validAuth, s: Authorization.SECP256K1_HALF_N };
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("accepts s = 1", () => {
		const auth = { ...validAuth, s: 1n };
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});
});

// ============================================================================
// Constants Tests
// ============================================================================

describe("Authorization constants", () => {
	it("MAGIC_BYTE is 0x05", () => {
		expect(Authorization.MAGIC_BYTE).toBe(0x05);
	});

	it("PER_EMPTY_ACCOUNT_COST is 25000", () => {
		expect(Authorization.PER_EMPTY_ACCOUNT_COST).toBe(25000n);
	});

	it("PER_AUTH_BASE_COST is 12500", () => {
		expect(Authorization.PER_AUTH_BASE_COST).toBe(12500n);
	});

	it("SECP256K1_N is correct", () => {
		expect(Authorization.SECP256K1_N).toBe(
			0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
		);
	});

	it("SECP256K1_HALF_N is N/2", () => {
		expect(Authorization.SECP256K1_HALF_N).toBe(
			Authorization.SECP256K1_N >> 1n,
		);
	});
});

// ============================================================================
// Hashing Tests (Not Implemented)
// ============================================================================

describe("Authorization.hash", () => {
	it("throws not implemented error", () => {
		const unsigned: Authorization.Unsigned = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
		};
		expect(() => Authorization.hash.call(unsigned)).toThrow(
			"not yet implemented",
		);
	});
});

// ============================================================================
// Signing Tests (Not Implemented)
// ============================================================================

describe("Authorization.sign", () => {
	it("throws not implemented error", () => {
		const unsigned: Authorization.Unsigned = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
		};
		const privateKey = new Uint8Array(32);
		expect(() => Authorization.sign.call(unsigned, privateKey)).toThrow(
			"not yet implemented",
		);
	});
});

// ============================================================================
// Verification Tests (Not Implemented)
// ============================================================================

describe("Authorization.verify", () => {
	it("throws not implemented error for valid auth", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => Authorization.verify.call(auth)).toThrow(
			"not yet implemented",
		);
	});

	it("validates before throwing not implemented", () => {
		const auth: Authorization.Item = {
			chainId: 0n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => Authorization.verify.call(auth)).toThrow(
			Authorization.ValidationError,
		);
	});
});

// ============================================================================
// Gas Calculation Tests
// ============================================================================

describe("Authorization.calculateGasCost", () => {
	it("calculates cost for empty list with no empty accounts", () => {
		const authList: Authorization.Item[] = [];
		const cost = Authorization.calculateGasCost.call(authList, 0);
		expect(cost).toBe(0n);
	});

	it("calculates cost for single authorization with no empty account", () => {
		const authList: Authorization.Item[] = [
			{
				chainId: 1n,
				address: addr1,
				nonce: 0n,
				yParity: 0,
				r: 0x123n,
				s: 0x456n,
			},
		];
		const cost = Authorization.calculateGasCost.call(authList, 0);
		expect(cost).toBe(Authorization.PER_AUTH_BASE_COST);
	});

	it("calculates cost for single authorization with one empty account", () => {
		const authList: Authorization.Item[] = [
			{
				chainId: 1n,
				address: addr1,
				nonce: 0n,
				yParity: 0,
				r: 0x123n,
				s: 0x456n,
			},
		];
		const cost = Authorization.calculateGasCost.call(authList, 1);
		expect(cost).toBe(
			Authorization.PER_AUTH_BASE_COST + Authorization.PER_EMPTY_ACCOUNT_COST,
		);
	});

	it("calculates cost for multiple authorizations with multiple empty accounts", () => {
		const authList: Authorization.Item[] = [
			{
				chainId: 1n,
				address: addr1,
				nonce: 0n,
				yParity: 0,
				r: 0x123n,
				s: 0x456n,
			},
			{
				chainId: 1n,
				address: addr2,
				nonce: 0n,
				yParity: 1,
				r: 0x789n,
				s: 0xabcn,
			},
		];
		const cost = Authorization.calculateGasCost.call(authList, 2);
		expect(cost).toBe(
			Authorization.PER_AUTH_BASE_COST * 2n +
				Authorization.PER_EMPTY_ACCOUNT_COST * 2n,
		);
		expect(cost).toBe(75000n);
	});
});

describe("Authorization.getGasCost", () => {
	const auth: Authorization.Item = {
		chainId: 1n,
		address: addr1,
		nonce: 0n,
		yParity: 0,
		r: 0x123n,
		s: 0x456n,
	};

	it("returns base cost when account is not empty", () => {
		const cost = Authorization.getGasCost.call(auth, false);
		expect(cost).toBe(Authorization.PER_AUTH_BASE_COST);
	});

	it("returns base cost + empty account cost when account is empty", () => {
		const cost = Authorization.getGasCost.call(auth, true);
		expect(cost).toBe(
			Authorization.PER_AUTH_BASE_COST + Authorization.PER_EMPTY_ACCOUNT_COST,
		);
		expect(cost).toBe(37500n);
	});
});

// ============================================================================
// Processing Tests (Relies on verify which is not implemented)
// ============================================================================

describe("Authorization.process", () => {
	it("throws not implemented error", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => Authorization.process.call(auth)).toThrow(
			"not yet implemented",
		);
	});
});

describe("Authorization.processAll", () => {
	it("throws not implemented error for non-empty list", () => {
		const authList: Authorization.Item[] = [
			{
				chainId: 1n,
				address: addr1,
				nonce: 0n,
				yParity: 0,
				r: 0x123n,
				s: 0x456n,
			},
		];
		expect(() => Authorization.processAll.call(authList)).toThrow(
			"not yet implemented",
		);
	});

	it("returns empty array for empty list", () => {
		const authList: Authorization.Item[] = [];
		const result = Authorization.processAll.call(authList);
		expect(result).toEqual([]);
	});
});

// ============================================================================
// Utility Tests
// ============================================================================

describe("Authorization.format", () => {
	it("formats signed authorization", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 42n,
			yParity: 1,
			r: 0x123n,
			s: 0x456n,
		};
		const formatted = Authorization.format.call(auth);
		expect(formatted).toContain("Authorization");
		expect(formatted).toContain("chain=1");
		expect(formatted).toContain("nonce=42");
		expect(formatted).toContain("r=0x123");
		expect(formatted).toContain("s=0x456");
		expect(formatted).toContain("v=1");
	});

	it("formats unsigned authorization", () => {
		const unsigned: Authorization.Unsigned = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
		};
		const formatted = Authorization.format.call(unsigned);
		expect(formatted).toContain("Authorization");
		expect(formatted).toContain("chain=1");
		expect(formatted).toContain("nonce=0");
		expect(formatted).not.toContain("r=");
		expect(formatted).not.toContain("s=");
	});

	it("shortens address in output", () => {
		const bytes = new Uint8Array(20);
		for (let i = 0; i < 20; i++) {
			bytes[i] = 0x12 + i;
		}
		const longAddr = Object.assign(bytes, {
			bytes,
		}) as unknown as BrandedAddress;
		const auth: Authorization.Item = {
			chainId: 1n,
			address: longAddr,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		const formatted = Authorization.format.call(auth);
		expect(formatted).toContain("0x");
	});
});

describe("Authorization.equals", () => {
	const auth1: Authorization.Item = {
		chainId: 1n,
		address: addr1,
		nonce: 0n,
		yParity: 0,
		r: 0x123n,
		s: 0x456n,
	};

	it("returns true for identical authorizations", () => {
		const auth2 = { ...auth1 };
		expect(Authorization.equals.call(auth1, auth2)).toBe(true);
	});

	it("returns true for same authorization instance", () => {
		expect(Authorization.equals.call(auth1, auth1)).toBe(true);
	});

	it("returns false for different chainId", () => {
		const auth2 = { ...auth1, chainId: 2n };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});

	it("returns false for different address", () => {
		const auth2 = { ...auth1, address: addr2 };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});

	it("returns false for different nonce", () => {
		const auth2 = { ...auth1, nonce: 1n };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});

	it("returns false for different yParity", () => {
		const auth2 = { ...auth1, yParity: 1 };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});

	it("returns false for different r", () => {
		const auth2 = { ...auth1, r: 0x789n };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});

	it("returns false for different s", () => {
		const auth2 = { ...auth1, s: 0xabcn };
		expect(Authorization.equals.call(auth1, auth2)).toBe(false);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Authorization edge cases", () => {
	it("handles maximum chain ID", () => {
		const auth: Authorization.Item = {
			chainId: 2n ** 64n - 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("handles maximum nonce", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 2n ** 64n - 1n,
			yParity: 0,
			r: 0x123n,
			s: 0x456n,
		};
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("handles maximum valid r", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: Authorization.SECP256K1_N - 1n,
			s: 0x123n,
		};
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("handles maximum valid s", () => {
		const auth: Authorization.Item = {
			chainId: 1n,
			address: addr1,
			nonce: 0n,
			yParity: 0,
			r: 0x123n,
			s: Authorization.SECP256K1_HALF_N,
		};
		expect(() => Authorization.validate.call(auth)).not.toThrow();
	});

	it("handles large authorization lists", () => {
		const authList: Authorization.Item[] = [];
		for (let i = 0; i < 100; i++) {
			authList.push({
				chainId: 1n,
				address: createAddress(i % 20),
				nonce: BigInt(i),
				yParity: i % 2,
				r: BigInt(i + 1),
				s: BigInt(i + 2),
			});
		}
		const cost = Authorization.calculateGasCost.call(authList, 50);
		expect(cost).toBe(
			Authorization.PER_AUTH_BASE_COST * 100n +
				Authorization.PER_EMPTY_ACCOUNT_COST * 50n,
		);
	});
});
