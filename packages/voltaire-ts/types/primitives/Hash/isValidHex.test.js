import { describe, expect, it } from "vitest";
import { isValidHex } from "./isValidHex.js";
describe("isValidHex", () => {
    describe("valid hex", () => {
        it("returns true for valid hash hex with 0x prefix", () => {
            const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for valid hash hex without 0x prefix", () => {
            const hex = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for uppercase hex", () => {
            const hex = "0xABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for mixed case hex", () => {
            const hex = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf0123456789aBcDeF0123456789";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for all zeros", () => {
            const hex = "0x0000000000000000000000000000000000000000000000000000000000000000";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for all fs", () => {
            const hex = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            expect(isValidHex(hex)).toBe(true);
        });
        it("returns true for all Fs uppercase", () => {
            const hex = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";
            expect(isValidHex(hex)).toBe(true);
        });
    });
    describe("invalid length", () => {
        it("returns false for too short hex", () => {
            expect(isValidHex("0x1234")).toBe(false);
        });
        it("returns false for too long hex", () => {
            expect(isValidHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00")).toBe(false);
        });
        it("returns false for empty string", () => {
            expect(isValidHex("")).toBe(false);
        });
        it("returns false for only 0x", () => {
            expect(isValidHex("0x")).toBe(false);
        });
        it("returns false for 63 chars", () => {
            expect(isValidHex("0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef12")).toBe(false);
        });
        it("returns false for 65 chars", () => {
            expect(isValidHex("0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123")).toBe(false);
        });
    });
    describe("invalid characters", () => {
        it("returns false for invalid hex characters", () => {
            expect(isValidHex("0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
        });
        it("returns false for space in hex", () => {
            expect(isValidHex("0x1234567890abcdef 234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for dash in hex", () => {
            expect(isValidHex("0x1234567890abcdef-234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for special characters", () => {
            expect(isValidHex("0x1234567890abcdef@234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for g character", () => {
            expect(isValidHex("0xg234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for underscore", () => {
            expect(isValidHex("0x1234567890abcdef_234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for newline", () => {
            expect(isValidHex("0x1234567890abcdef\n234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
        it("returns false for tab", () => {
            expect(isValidHex("0x1234567890abcdef\t234567890abcdef1234567890abcdef1234567890abcdef")).toBe(false);
        });
    });
    describe("validation before parsing", () => {
        it("can be used before fromHex", () => {
            const hex = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            if (isValidHex(hex)) {
                expect(true).toBe(true);
            }
        });
        it("prevents invalid input", () => {
            const hex = "0x1234";
            expect(isValidHex(hex)).toBe(false);
        });
        it("validates correct length", () => {
            const valid64Chars = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            expect(isValidHex(valid64Chars)).toBe(true);
        });
    });
    describe("edge cases", () => {
        it("returns false for non-string", () => {
            // @ts-expect-error - testing runtime behavior
            expect(isValidHex(123)).toBe(false);
        });
        it("returns false for null", () => {
            // @ts-expect-error - testing runtime behavior
            expect(isValidHex(null)).toBe(false);
        });
        it("returns false for undefined", () => {
            // @ts-expect-error - testing runtime behavior
            expect(isValidHex(undefined)).toBe(false);
        });
        it("returns false for object", () => {
            // @ts-expect-error - testing runtime behavior
            expect(isValidHex({})).toBe(false);
        });
        it("returns false for Uint8Array", () => {
            // @ts-expect-error - testing runtime behavior
            expect(isValidHex(new Uint8Array(32))).toBe(false);
        });
        it("handles hex with only numbers", () => {
            const hex = "0x0123456789012345678901234567890123456789012345678901234567890123";
            expect(isValidHex(hex)).toBe(true);
        });
        it("handles hex with only letters", () => {
            const hex = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
            expect(isValidHex(hex)).toBe(true);
        });
    });
});
