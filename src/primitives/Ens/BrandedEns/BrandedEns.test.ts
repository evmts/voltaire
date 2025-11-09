import { describe, expect, it } from "vitest";
import * as Ens from "./index.js";

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
		it("should compute namehash for domain", () => {
			const result = Ens.namehash("vitalik.eth");
			expect(result).toBe(
				"0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835",
			);
		});

		it("should compute namehash for subdomain", () => {
			const result = Ens.namehash("sub.vitalik.eth");
			expect(result).toHaveLength(66); // 0x + 64 hex chars
			expect(result).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("should compute namehash for empty name", () => {
			const result = Ens.namehash("");
			expect(result).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});
	});

	describe("labelhash", () => {
		it("should compute labelhash for label", () => {
			const result = Ens.labelhash("vitalik");
			expect(result).toBe(
				"0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc",
			);
		});

		it("should compute labelhash for different label", () => {
			const result = Ens.labelhash("eth");
			expect(result).toHaveLength(66); // 0x + 64 hex chars
			expect(result).toMatch(/^0x[0-9a-f]{64}$/);
		});
	});
});
