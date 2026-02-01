import { describe, expect, it } from "vitest";
import * as CompilerVersion from "./index.js";

describe("CompilerVersion", () => {
	describe("from", () => {
		it("should create version from valid string", () => {
			const v1 = CompilerVersion.from("v0.8.20+commit.a1b2c3d4");
			expect(v1).toBe("v0.8.20+commit.a1b2c3d4");

			const v2 = CompilerVersion.from("0.8.20");
			expect(v2).toBe("0.8.20");

			const v3 = CompilerVersion.from("0.4.26+commit.4563c3fc");
			expect(v3).toBe("0.4.26+commit.4563c3fc");
		});

		it("should throw on invalid input", () => {
			expect(() => CompilerVersion.from("")).toThrow("cannot be empty");
			expect(() => CompilerVersion.from("abc")).toThrow(
				"Invalid compiler version format",
			);
			// biome-ignore lint/suspicious/noExplicitAny: test requires type flexibility
			expect(() => CompilerVersion.from(123 as any)).toThrow(
				"must be a string",
			);
		});
	});

	describe("parse", () => {
		it("should parse version with commit", () => {
			const parsed = CompilerVersion.parse("v0.8.20+commit.a1b2c3d4");
			expect(parsed.major).toBe(0);
			expect(parsed.minor).toBe(8);
			expect(parsed.patch).toBe(20);
			expect(parsed.commit).toBe("a1b2c3d4");
		});

		it("should parse version without v prefix", () => {
			const parsed = CompilerVersion.parse("0.8.20");
			expect(parsed.major).toBe(0);
			expect(parsed.minor).toBe(8);
			expect(parsed.patch).toBe(20);
			expect(parsed.commit).toBeUndefined();
		});

		it("should parse version with prerelease", () => {
			const parsed = CompilerVersion.parse("0.8.20-alpha.1");
			expect(parsed.major).toBe(0);
			expect(parsed.minor).toBe(8);
			expect(parsed.patch).toBe(20);
			expect(parsed.prerelease).toBe("alpha.1");
		});

		it("should parse version without patch", () => {
			const parsed = CompilerVersion.parse("0.8");
			expect(parsed.major).toBe(0);
			expect(parsed.minor).toBe(8);
			expect(parsed.patch).toBe(0);
		});
	});

	describe("compare", () => {
		it("should compare versions correctly", () => {
			expect(CompilerVersion.compare("0.8.20", "0.8.19")).toBe(1);
			expect(CompilerVersion.compare("0.8.19", "0.8.20")).toBe(-1);
			expect(CompilerVersion.compare("0.8.20", "0.8.20")).toBe(0);

			expect(CompilerVersion.compare("0.9.0", "0.8.20")).toBe(1);
			expect(CompilerVersion.compare("1.0.0", "0.9.0")).toBe(1);
		});

		it("should handle prerelease versions", () => {
			expect(CompilerVersion.compare("0.8.20-alpha", "0.8.20")).toBe(-1);
			expect(CompilerVersion.compare("0.8.20", "0.8.20-alpha")).toBe(1);
			expect(CompilerVersion.compare("0.8.20-alpha", "0.8.20-beta")).toBe(-1);
		});
	});

	describe("getMajor", () => {
		it("should extract major version", () => {
			expect(CompilerVersion.getMajor("v0.8.20")).toBe(0);
			expect(CompilerVersion.getMajor("1.0.0")).toBe(1);
		});
	});

	describe("getMinor", () => {
		it("should extract minor version", () => {
			expect(CompilerVersion.getMinor("v0.8.20")).toBe(8);
			expect(CompilerVersion.getMinor("1.2.3")).toBe(2);
		});
	});

	describe("getPatch", () => {
		it("should extract patch version", () => {
			expect(CompilerVersion.getPatch("v0.8.20")).toBe(20);
			expect(CompilerVersion.getPatch("1.2.3")).toBe(3);
		});
	});

	describe("isCompatible", () => {
		it("should check caret range compatibility", () => {
			expect(CompilerVersion.isCompatible("0.8.20", "^0.8.0")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.0", "^0.8.0")).toBe(true);
			expect(CompilerVersion.isCompatible("0.9.0", "^0.8.0")).toBe(false);
			expect(CompilerVersion.isCompatible("0.7.0", "^0.8.0")).toBe(false);
		});

		it("should check tilde range compatibility", () => {
			expect(CompilerVersion.isCompatible("0.8.20", "~0.8.20")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.21", "~0.8.20")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.19", "~0.8.20")).toBe(false);
			expect(CompilerVersion.isCompatible("0.9.0", "~0.8.20")).toBe(false);
		});

		it("should check >= range", () => {
			expect(CompilerVersion.isCompatible("0.8.20", ">=0.8.0")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.0", ">=0.8.0")).toBe(true);
			expect(CompilerVersion.isCompatible("0.7.0", ">=0.8.0")).toBe(false);
		});

		it("should check exact match", () => {
			expect(CompilerVersion.isCompatible("0.8.20", "0.8.20")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.21", "0.8.20")).toBe(false);
		});

		it("should handle major version 0 caret ranges", () => {
			// ^0.8.20 should match 0.8.x where x >= 20, but not 0.9.x
			expect(CompilerVersion.isCompatible("0.8.20", "^0.8.20")).toBe(true);
			expect(CompilerVersion.isCompatible("0.8.25", "^0.8.20")).toBe(true);
			expect(CompilerVersion.isCompatible("0.9.0", "^0.8.20")).toBe(false);
		});
	});

	describe("real-world solidity versions", () => {
		it("should handle typical solidity versions", () => {
			const versions = [
				"v0.8.20+commit.a1b2c3d4",
				"v0.8.19+commit.7dd6d404",
				"v0.4.26+commit.4563c3fc",
			];

			for (const v of versions) {
				const version = CompilerVersion.from(v);
				const parsed = CompilerVersion.parse(version);
				expect(parsed.major).toBeGreaterThanOrEqual(0);
				expect(parsed.minor).toBeGreaterThanOrEqual(0);
			}
		});

		it("should identify checked arithmetic support", () => {
			// Solidity 0.8.0+ has checked arithmetic by default
			const v1 = CompilerVersion.from("0.8.20");
			expect(
				CompilerVersion.getMajor(v1) === 0 && CompilerVersion.getMinor(v1) >= 8,
			).toBe(true);

			const v2 = CompilerVersion.from("0.7.6");
			expect(
				CompilerVersion.getMajor(v2) === 0 && CompilerVersion.getMinor(v2) >= 8,
			).toBe(false);
		});
	});
});
