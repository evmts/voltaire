import { describe, it, expect } from "vitest";
import * as Ens from "./index.js";
import { DisallowedCharacterError } from "./errors.js";

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
});
