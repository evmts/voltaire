import { describe, expect, it } from "vitest";
import { ZERO } from "./constants.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { isZero } from "./isZero.js";
describe("isZero", () => {
    describe("zero hashes", () => {
        it("returns true for ZERO constant", () => {
            expect(isZero(ZERO)).toBe(true);
        });
        it("returns true for zero hash from fromBytes", () => {
            const hash = fromBytes(new Uint8Array(32));
            expect(isZero(hash)).toBe(true);
        });
        it("returns true for zero hash from fromHex", () => {
            const hash = fromHex("0x0000000000000000000000000000000000000000000000000000000000000000");
            expect(isZero(hash)).toBe(true);
        });
        it("returns true for manually created zero bytes", () => {
            const bytes = new Uint8Array(32);
            bytes.fill(0);
            const hash = fromBytes(bytes);
            expect(isZero(hash)).toBe(true);
        });
    });
    describe("non-zero hashes", () => {
        it("returns false for hash with last byte set", () => {
            const hash = fromHex("0x0000000000000000000000000000000000000000000000000000000000000001");
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for hash with first byte set", () => {
            const hash = fromHex("0x0100000000000000000000000000000000000000000000000000000000000000");
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for hash with middle byte set", () => {
            const hash = fromHex("0x0000000000000000000000000000000100000000000000000000000000000000");
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for all-ff hash", () => {
            const bytes = new Uint8Array(32);
            bytes.fill(0xff);
            const hash = fromBytes(bytes);
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for random hash", () => {
            const hash = fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
            expect(isZero(hash)).toBe(false);
        });
        it("returns false when single bit is set", () => {
            const bytes = new Uint8Array(32);
            bytes[15] = 0x01;
            const hash = fromBytes(bytes);
            expect(isZero(hash)).toBe(false);
        });
    });
    describe("constant-time comparison", () => {
        it("checks all bytes even with early non-zero", () => {
            const hash = fromHex("0xff00000000000000000000000000000000000000000000000000000000000000");
            expect(isZero(hash)).toBe(false);
        });
        it("checks all bytes even with late non-zero", () => {
            const hash = fromHex("0x00000000000000000000000000000000000000000000000000000000000000ff");
            expect(isZero(hash)).toBe(false);
        });
        it("checks all bytes for zero hash", () => {
            const hash = fromHex("0x0000000000000000000000000000000000000000000000000000000000000000");
            expect(isZero(hash)).toBe(true);
        });
    });
    describe("edge cases", () => {
        it("returns false for hash with only highest bit set", () => {
            const bytes = new Uint8Array(32);
            bytes[0] = 0x80;
            const hash = fromBytes(bytes);
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for hash with only lowest bit set", () => {
            const bytes = new Uint8Array(32);
            bytes[31] = 0x01;
            const hash = fromBytes(bytes);
            expect(isZero(hash)).toBe(false);
        });
        it("handles hash with multiple zero-like patterns", () => {
            const hash = fromHex("0x0000000000000000010000000000000000000000000000000000000000000000");
            expect(isZero(hash)).toBe(false);
        });
        it("returns false for wrong length array", () => {
            const arr = /** @type {*} */ (new Uint8Array(20));
            expect(isZero(arr)).toBe(false);
        });
    });
});
