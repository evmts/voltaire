import { describe, expect, it } from "vitest";
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import * as Hex from "../Hex/index.js";
import { Labelhash, Namehash } from "./index.js";
import * as Ens from "./index.js";

// Instantiate factory functions
const namehash = Namehash({ keccak256 });
const labelhash = Labelhash({ keccak256 });

describe("Ens", () => {
	describe("normalize", () => {
		it("should normalize uppercase to lowercase", () => {
			const result = Ens.normalize("VITALIK.eth");
			expect(result).toBe("vitalik.eth");
		});

		it("should normalize mixed case", () => {
			const result = Ens.normalize("Nick.ETH");
			expect(result).toBe("nick.eth");
		});

		it("should preserve already normalized names", () => {
			const result = Ens.normalize("vitalik.eth");
			expect(result).toBe("vitalik.eth");
		});

		it("should handle subdomain normalization", () => {
			const result = Ens.normalize("Sub.Domain.ETH");
			expect(result).toBe("sub.domain.eth");
		});

		it("should throw on invalid characters", () => {
			expect(() => Ens.normalize("invalid\x00.eth")).toThrow();
		});
	});

	describe("beautify", () => {
		it("should normalize while preserving emoji", () => {
			const result = Ens.beautify("💩.eth");
			expect(result.length).toBeGreaterThan(0);
			expect(result).toContain(".eth");
		});

		it("should normalize text content", () => {
			const result = Ens.beautify("TEST.eth");
			expect(result).toBe("test.eth");
		});
	});

	describe("from", () => {
		it("should create branded ENS name", () => {
			const result = Ens.from("vitalik.eth");
			expect(result).toBe("vitalik.eth");
		});
	});

	describe("is", () => {
		it("should return true for non-empty strings", () => {
			expect(Ens.is("vitalik.eth")).toBe(true);
		});

		it("should return false for empty strings", () => {
			expect(Ens.is("")).toBe(false);
		});

		it("should return false for non-strings", () => {
			expect(Ens.is(123)).toBe(false);
			expect(Ens.is(null)).toBe(false);
			expect(Ens.is(undefined)).toBe(false);
		});
	});

	describe("toString", () => {
		it("should convert branded ENS to string", () => {
			const branded = Ens.from("vitalik.eth");
			const result = Ens.toString(branded);
			expect(result).toBe("vitalik.eth");
		});
	});

	describe("namehash", () => {
		it("should compute namehash for domain (wrapper API)", () => {
			const result = Ens.namehash("vitalik.eth");
			expect(Hex.fromBytes(result)).toBe(
				"0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
			);
		});

		it("should compute namehash for domain (factory API)", () => {
			const result = namehash(Ens.from("vitalik.eth"));
			expect(Hex.fromBytes(result)).toBe(
				"0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
			);
		});

		it("should compute namehash for subdomain", () => {
			const result = Ens.namehash("sub.vitalik.eth");
			const hex = Hex.fromBytes(result);
			expect(hex).toHaveLength(66); // 0x + 64 hex chars
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("should compute namehash for empty name", () => {
			const result = Ens.namehash("");
			expect(Hex.fromBytes(result)).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		it("should compute namehash for empty name (factory API)", () => {
			const result = namehash(Ens.from(""));
			expect(Hex.fromBytes(result)).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});
	});

	describe("labelhash", () => {
		it("should compute labelhash for label (wrapper API)", () => {
			const result = Ens.labelhash("vitalik");
			expect(Hex.fromBytes(result)).toBe(
				"0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
			);
		});

		it("should compute labelhash for label (factory API)", () => {
			const result = labelhash(Ens.from("vitalik"));
			expect(Hex.fromBytes(result)).toBe(
				"0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
			);
		});

		it("should compute labelhash for different label", () => {
			const result = Ens.labelhash("eth");
			const hex = Hex.fromBytes(result);
			expect(hex).toHaveLength(66); // 0x + 64 hex chars
			expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
		});
	});

	describe("isValid", () => {
		it("should return true for valid ENS names", () => {
			expect(Ens.isValid("vitalik.eth")).toBe(true);
			expect(Ens.isValid("sub.domain.eth")).toBe(true);
			expect(Ens.isValid("test.eth")).toBe(true);
		});

		it("should return false for invalid ENS names", () => {
			expect(Ens.isValid("invalid\x00.eth")).toBe(false);
			expect(Ens.isValid("")).toBe(false);
		});

		it("should return false for non-strings", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(Ens.isValid(123 as any)).toBe(false);
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(Ens.isValid(null as any)).toBe(false);
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(Ens.isValid(undefined as any)).toBe(false);
		});
	});

	describe("validate", () => {
		it("should not throw for valid ENS names", () => {
			expect(() => Ens.validate("vitalik.eth")).not.toThrow();
			expect(() => Ens.validate("sub.domain.eth")).not.toThrow();
			expect(() => Ens.validate("test.eth")).not.toThrow();
		});

		it("should throw for invalid ENS names", () => {
			expect(() => Ens.validate("invalid\x00.eth")).toThrow();
			expect(() => Ens.validate("")).toThrow();
		});

		it("should throw for non-strings", () => {
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(() => Ens.validate(123 as any)).toThrow();
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(() => Ens.validate(null as any)).toThrow();
			// biome-ignore lint/suspicious/noExplicitAny: testing invalid input types
			expect(() => Ens.validate(undefined as any)).toThrow();
		});
	});
});
