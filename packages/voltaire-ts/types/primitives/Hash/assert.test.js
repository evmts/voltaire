import { describe, expect, it } from "vitest";
import { assert } from "./assert.js";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
describe("assert", () => {
    describe("valid hashes", () => {
        it("does not throw for valid hash", () => {
            const hash = fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
            expect(() => assert(hash)).not.toThrow();
        });
        it("does not throw for zero hash", () => {
            const hash = fromBytes(new Uint8Array(32));
            expect(() => assert(hash)).not.toThrow();
        });
        it("does not throw for all-ff hash", () => {
            const bytes = new Uint8Array(32);
            bytes.fill(0xff);
            const hash = fromBytes(bytes);
            expect(() => assert(hash)).not.toThrow();
        });
        it("does not throw for plain Uint8Array of length 32", () => {
            const arr = new Uint8Array(32);
            expect(() => assert(arr)).not.toThrow();
        });
    });
    describe("invalid hashes", () => {
        it("throws for invalid hash", () => {
            expect(() => assert(new Uint8Array(20))).toThrow();
        });
        it("throws for non-Uint8Array", () => {
            expect(() => assert("not a hash")).toThrow();
        });
        it("throws for null", () => {
            expect(() => assert(null)).toThrow();
        });
        it("throws for undefined", () => {
            expect(() => assert(undefined)).toThrow();
        });
        it("throws for number", () => {
            expect(() => assert(123)).toThrow();
        });
        it("throws for object", () => {
            expect(() => assert({})).toThrow();
        });
        it("throws for array", () => {
            expect(() => assert([])).toThrow();
        });
        it("throws for too short Uint8Array", () => {
            expect(() => assert(new Uint8Array(31))).toThrow();
        });
        it("throws for too long Uint8Array", () => {
            expect(() => assert(new Uint8Array(33))).toThrow();
        });
        it("throws for empty Uint8Array", () => {
            expect(() => assert(new Uint8Array(0))).toThrow();
        });
    });
    describe("error messages", () => {
        it("includes default error message", () => {
            try {
                assert(new Uint8Array(20));
            }
            catch (e) {
                const error = /** @type {*} */ (e);
                expect(error.message).toContain("Value is not a Hash");
            }
        });
        it("accepts custom error message", () => {
            try {
                assert(new Uint8Array(20), "Custom error message");
            }
            catch (e) {
                const error = /** @type {*} */ (e);
                expect(error.message).toContain("Custom error message");
            }
        });
        it("provides helpful error context", () => {
            try {
                assert("not a hash");
            }
            catch (e) {
                const error = /** @type {*} */ (e);
                expect(error.message).toBeTruthy();
            }
        });
        it("error has code", () => {
            try {
                assert(new Uint8Array(20));
            }
            catch (e) {
                const error = /** @type {*} */ (e);
                expect(error.code).toBe("HASH_INVALID_TYPE");
            }
        });
        it("error includes expected value", () => {
            try {
                assert(new Uint8Array(20));
            }
            catch (e) {
                const error = /** @type {*} */ (e);
                expect(error.expected).toBe("32-byte Uint8Array");
            }
        });
    });
    describe("type assertion", () => {
        it("narrows type after successful assertion", () => {
            const value = new Uint8Array(32);
            assert(value);
            expect(value.length).toBe(32);
        });
        it("works in conditional flow", () => {
            const value = new Uint8Array(32);
            let executed = false;
            try {
                assert(value);
                executed = true;
            }
            catch { }
            expect(executed).toBe(true);
        });
    });
    describe("edge cases", () => {
        it("throws for hex string instead of hash", () => {
            expect(() => assert("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")).toThrow();
        });
        it("throws for regular array", () => {
            const arr = new Array(32).fill(0);
            expect(() => assert(arr)).toThrow();
        });
        it("throws for Int8Array", () => {
            expect(() => assert(new Int8Array(32))).toThrow();
        });
        it("throws for Uint16Array", () => {
            expect(() => assert(new Uint16Array(32))).toThrow();
        });
        it("accepts Uint8Array subclass of length 32", () => {
            class CustomArray extends Uint8Array {
            }
            const arr = new CustomArray(32);
            expect(() => assert(arr)).not.toThrow();
        });
        it("throws for function", () => {
            expect(() => assert(() => { })).toThrow();
        });
        it("throws for boolean", () => {
            expect(() => assert(true)).toThrow();
        });
    });
});
