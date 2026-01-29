import { describe, expect, it } from "@effect/vitest";
import { TreeFormatter } from "effect/ParseResult";
import * as S from "effect/Schema";
import * as PrivateKey from "./index.js";

const formatError = TreeFormatter.formatErrorSync;

describe("PrivateKey parse error messages", () => {
	describe("PrivateKey.Hex", () => {
		it("shows helpful error for wrong length (too short)", () => {
			const result = S.decodeUnknownEither(PrivateKey.Hex)("0x1234");

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				// Should mention expected length
				expect(formatted).toContain("64");

				// Should NOT expose the attempted value
				expect(formatted).not.toContain("1234");

				expect(formatted).toMatchInlineSnapshot(`"Invalid private key: expected 64 hex characters (32 bytes)"`);
			}
		});

		it("shows helpful error for invalid hex characters", () => {
			const result = S.decodeUnknownEither(PrivateKey.Hex)("0x" + "gg".repeat(32));

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				// Should NOT expose the invalid input
				expect(formatted).not.toContain("gggg");

				expect(formatted).toMatchInlineSnapshot(`"Invalid private key: expected 64 hex characters (32 bytes)"`);
			}
		});

		it("shows helpful error for wrong type (number)", () => {
			const result = S.decodeUnknownEither(PrivateKey.Hex)(12345);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				expect(formatted).toMatchInlineSnapshot(`
					"PrivateKey.Hex
					└─ Encoded side transformation failure
					   └─ Expected string, actual 12345"
				`);
			}
		});

		it("shows helpful error for null", () => {
			const result = S.decodeUnknownEither(PrivateKey.Hex)(null);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				expect(formatted).toContain("Expected");
				expect(formatted).toMatchInlineSnapshot(`
					"PrivateKey.Hex
					└─ Encoded side transformation failure
					   └─ Expected string, actual null"
				`);
			}
		});

		it("does not leak key material in errors for almost valid key", () => {
			// 62 valid hex chars + 2 invalid chars - almost looks like a real key
			const almostValidKey = "0x" + "ab".repeat(31) + "xx";
			const result = S.decodeUnknownEither(PrivateKey.Hex)(almostValidKey);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				// Error should NOT contain ANY of the key material
				expect(formatted).not.toContain("abab");
				expect(formatted).not.toContain("ab".repeat(31));
				expect(formatted).not.toContain(almostValidKey);
				expect(formatted).not.toContain(almostValidKey.slice(2)); // without 0x
			}
		});
	});

	describe("PrivateKey.Bytes", () => {
		it("shows helpful error for wrong length (too short)", () => {
			const bytes = new Uint8Array(16);
			const result = S.decodeUnknownEither(PrivateKey.Bytes)(bytes);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				// Should mention expected length
				expect(formatted).toContain("32");

				expect(formatted).toMatchInlineSnapshot(`
					"PrivateKey.Bytes
					└─ Transformation process failure
					   └─ Private key must be 32 bytes, got 16

					Docs: https://voltaire.dev/primitives/private-key"
				`);
			}
		});

		it("shows helpful error for wrong type (not Uint8Array)", () => {
			const result = S.decodeUnknownEither(PrivateKey.Bytes)([1, 2, 3]);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				expect(formatted).toMatchInlineSnapshot(`
					"PrivateKey.Bytes
					└─ Encoded side transformation failure
					   └─ Expected Uint8ArrayFromSelf, actual [1,2,3]"
				`);
			}
		});
	});

	describe("PrivateKey.RedactedHex", () => {
		it("does not leak key material for invalid input", () => {
			const almostValidKey = "0x" + "cd".repeat(31) + "zz";
			const result = S.decodeUnknownEither(PrivateKey.RedactedHex)(almostValidKey);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				// Redacted schema should be extra careful
				expect(formatted).not.toContain("cdcd");
				expect(formatted).not.toContain(almostValidKey);

				expect(formatted).toMatchInlineSnapshot(`"Invalid private key: expected 64 hex characters (32 bytes)"`);
			}
		});
	});

	describe("PrivateKey.RedactedBytes", () => {
		it("shows helpful error for wrong length", () => {
			const bytes = new Uint8Array(31);
			const result = S.decodeUnknownEither(PrivateKey.RedactedBytes)(bytes);

			expect(result._tag).toBe("Left");
			if (result._tag === "Left") {
				const formatted = formatError(result.left);

				expect(formatted).toMatchInlineSnapshot(`
					"PrivateKey.RedactedBytes
					└─ Transformation process failure
					   └─ Invalid private key format"
				`);
			}
		});
	});
});
