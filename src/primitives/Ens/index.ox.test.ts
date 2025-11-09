import { describe, it, expect } from "vitest";
import * as OxEns from "ox/Ens";
import * as VoltaireEns from "./index.ox.js";

describe("Ens - Ox Migration", () => {
	describe("Ox Core Functions", () => {
		describe("normalize", () => {
			it("should normalize uppercase to lowercase", () => {
				const result = VoltaireEns.normalize("VITALIK.eth");
				expect(result).toBe("vitalik.eth");
			});

			it("should normalize mixed case", () => {
				const result = VoltaireEns.normalize("Nick.ETH");
				expect(result).toBe("nick.eth");
			});

			it("should preserve already normalized names", () => {
				const result = VoltaireEns.normalize("vitalik.eth");
				expect(result).toBe("vitalik.eth");
			});

			it("should handle subdomain normalization", () => {
				const result = VoltaireEns.normalize("Sub.Domain.ETH");
				expect(result).toBe("sub.domain.eth");
			});

			it("should throw on invalid characters", () => {
				expect(() => VoltaireEns.normalize("invalid\x00.eth")).toThrow();
			});

			it("should match Ox behavior", () => {
				const testCases = [
					"vitalik.eth",
					"nick.eth",
					"test.eth",
					"sub.domain.eth",
				];
				for (const name of testCases) {
					const oxResult = OxEns.normalize(name);
					const voltaireResult = VoltaireEns.normalize(name);
					expect(voltaireResult).toBe(oxResult);
				}
			});
		});

		describe("namehash", () => {
			it("should compute namehash for ENS names", () => {
				const hash = VoltaireEns.namehash("vitalik.eth");
				expect(typeof hash).toBe("string");
				expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
			});

			it("should match Ox implementation", () => {
				const testNames = ["vitalik.eth", "nick.eth", "test.eth"];
				for (const name of testNames) {
					const oxHash = OxEns.namehash(name);
					const voltaireHash = VoltaireEns.namehash(name);
					expect(voltaireHash).toBe(oxHash);
				}
			});

			it("should handle root domain", () => {
				const hash = VoltaireEns.namehash("");
				expect(hash).toBe(OxEns.namehash(""));
			});
		});

		describe("labelhash", () => {
			it("should compute labelhash for labels", () => {
				const hash = VoltaireEns.labelhash("vitalik");
				expect(typeof hash).toBe("string");
				expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
			});

			it("should match Ox implementation", () => {
				const testLabels = ["vitalik", "nick", "test", "eth"];
				for (const label of testLabels) {
					const oxHash = OxEns.labelhash(label);
					const voltaireHash = VoltaireEns.labelhash(label);
					expect(voltaireHash).toBe(oxHash);
				}
			});

			it("should correctly hash the eth label", () => {
				const hash = VoltaireEns.labelhash("eth");
				expect(hash).toBe(
					"0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0",
				);
			});
		});
	});

	describe("Voltaire Extensions", () => {
		describe("from", () => {
			it("should create branded ENS name", () => {
				const result = VoltaireEns.from("vitalik.eth");
				expect(result).toBe("vitalik.eth");
			});

			it("should accept any string", () => {
				const result = VoltaireEns.from("test123.eth");
				expect(result).toBe("test123.eth");
			});
		});

		describe("is", () => {
			it("should return true for non-empty strings", () => {
				expect(VoltaireEns.is("vitalik.eth")).toBe(true);
			});

			it("should return false for empty strings", () => {
				expect(VoltaireEns.is("")).toBe(false);
			});

			it("should return false for non-strings", () => {
				expect(VoltaireEns.is(123)).toBe(false);
				expect(VoltaireEns.is(null)).toBe(false);
				expect(VoltaireEns.is(undefined)).toBe(false);
			});
		});

		describe("toString", () => {
			it("should convert branded ENS to string", () => {
				const branded = VoltaireEns.from("vitalik.eth");
				const result = VoltaireEns.toString(branded);
				expect(result).toBe("vitalik.eth");
			});
		});

		describe("beautify", () => {
			it("should normalize while preserving emoji", () => {
				const result = VoltaireEns.beautify("💩.eth");
				expect(result.length).toBeGreaterThan(0);
				expect(result).toContain(".eth");
			});

			it("should normalize text content", () => {
				const result = VoltaireEns.beautify("TEST.eth");
				expect(result).toBe("test.eth");
			});
		});
	});

	describe("Migration Compatibility", () => {
		it("should have all expected exports", () => {
			const expectedFunctions = [
				"normalize",
				"namehash",
				"labelhash",
				"from",
				"is",
				"toString",
				"beautify",
			];

			for (const fn of expectedFunctions) {
				expect(typeof (VoltaireEns as Record<string, unknown>)[fn]).toBe(
					"function",
				);
			}
		});

		it("should have BrandedEns namespace", () => {
			expect(VoltaireEns.BrandedEns).toBeDefined();
		});

		it("should properly delegate Ox functions", () => {
			const testName = "vitalik.eth";

			// Test normalize delegation
			expect(VoltaireEns.normalize(testName)).toBe(OxEns.normalize(testName));

			// Test namehash delegation
			expect(VoltaireEns.namehash(testName)).toBe(OxEns.namehash(testName));

			// Test labelhash delegation
			const label = "vitalik";
			expect(VoltaireEns.labelhash(label)).toBe(OxEns.labelhash(label));
		});
	});
});
