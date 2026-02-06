import { describe, expect, it } from "vitest";
import { InvalidSizeError } from "./errors.js";
import { padRight } from "./padRight.js";
describe("Hex.padRight", () => {
    describe("basic padding", () => {
        it("pads hex to target size on right", () => {
            const hex = "0x1234";
            expect(padRight(hex, 4)).toBe("0x12340000");
            expect(padRight(hex, 8)).toBe("0x1234000000000000");
        });
        it("does not pad if already at target size", () => {
            const hex = "0x1234";
            expect(padRight(hex, 2)).toBe("0x1234");
        });
        it("does not pad if larger than target size", () => {
            const hex = "0x1234abcd";
            expect(padRight(hex, 2)).toBe("0x1234abcd");
            expect(padRight(hex, 1)).toBe("0x1234abcd");
        });
        it("pads empty hex", () => {
            const hex = "0x";
            expect(padRight(hex, 2)).toBe("0x0000");
            expect(padRight(hex, 4)).toBe("0x00000000");
        });
    });
    describe("single byte padding", () => {
        it("pads single byte to various sizes", () => {
            const hex = "0xff";
            expect(padRight(hex, 2)).toBe("0xff00");
            expect(padRight(hex, 4)).toBe("0xff000000");
            expect(padRight(hex, 8)).toBe("0xff00000000000000");
        });
        it("pads zero byte", () => {
            const hex = "0x00";
            expect(padRight(hex, 2)).toBe("0x0000");
            expect(padRight(hex, 4)).toBe("0x00000000");
        });
    });
    describe("edge cases", () => {
        it("pads to zero size returns original", () => {
            const hex = "0x1234";
            expect(padRight(hex, 0)).toBe("0x1234");
        });
        it("pads odd hex preserves data", () => {
            const hex = "0x123";
            expect(padRight(hex, 4)).toBe("0x12300000");
        });
        it("handles all zeros", () => {
            const hex = "0x0000";
            expect(padRight(hex, 4)).toBe("0x00000000");
        });
        it("handles all ones", () => {
            const hex = "0xffff";
            expect(padRight(hex, 4)).toBe("0xffff0000");
        });
    });
    describe("common Ethereum sizes", () => {
        it("pads to Bytes4 size (4 bytes)", () => {
            const hex = "0x12";
            const padded = padRight(hex, 4);
            expect(padded.length).toBe(2 + 4 * 2);
            expect(padded).toBe("0x12000000");
        });
        it("pads to address size (20 bytes)", () => {
            const hex = "0x1234";
            const padded = padRight(hex, 20);
            expect(padded.length).toBe(2 + 20 * 2);
            expect(padded.startsWith("0x1234")).toBe(true);
            expect(padded.endsWith("000000")).toBe(true);
        });
        it("pads to hash size (32 bytes)", () => {
            const hex = "0xabcd";
            const padded = padRight(hex, 32);
            expect(padded.length).toBe(2 + 32 * 2);
            expect(padded.startsWith("0xabcd")).toBe(true);
            expect(padded.endsWith("000000")).toBe(true);
        });
        it("pads selector to slot (4 bytes to 32 bytes)", () => {
            const hex = "0xa9059cbb";
            const padded = padRight(hex, 32);
            expect(padded.length).toBe(2 + 32 * 2);
            expect(padded.startsWith("0xa9059cbb")).toBe(true);
        });
    });
    describe("case handling", () => {
        it("converts to lowercase when padding", () => {
            const hex = "0xABCD";
            expect(padRight(hex, 4)).toBe("0xabcd0000");
        });
        it("converts mixed case to lowercase", () => {
            const hex = "0xAbCd";
            expect(padRight(hex, 4)).toBe("0xabcd0000");
        });
        it("handles uppercase hex digits in padding", () => {
            const hex = "0xDEAD";
            expect(padRight(hex, 4)).toBe("0xdead0000");
        });
    });
    describe("large padding", () => {
        it("handles large padding", () => {
            const hex = "0x12";
            const padded = padRight(hex, 100);
            expect(padded.length).toBe(2 + 100 * 2);
            expect(padded.startsWith("0x12")).toBe(true);
            expect(padded.endsWith("000000")).toBe(true);
        });
        it("handles very large padding", () => {
            const hex = "0xff";
            const padded = padRight(hex, 256);
            expect(padded.length).toBe(2 + 256 * 2);
            expect(padded.startsWith("0xff")).toBe(true);
        });
    });
    describe("difference from pad (left padding)", () => {
        it("pads right vs left comparison", () => {
            const hex = "0x12";
            const rightPadded = padRight(hex, 4);
            expect(rightPadded).toBe("0x12000000");
            expect(rightPadded.endsWith("000000")).toBe(true);
            expect(rightPadded.startsWith("0x12")).toBe(true);
        });
        it("suffix zeros for right padding", () => {
            const hex = "0xabcd";
            const padded = padRight(hex, 4);
            expect(padded).toBe("0xabcd0000");
            expect(padded.slice(-4)).toBe("0000");
        });
        it("prefix zeros for left padding would be different", () => {
            const hex = "0xabcd";
            const rightPadded = padRight(hex, 4);
            expect(rightPadded).toBe("0xabcd0000");
            expect(rightPadded.slice(2, 6)).toBe("abcd");
        });
    });
    describe("round-trip compatibility", () => {
        it("produces valid hex string format", () => {
            const hex = "0x12";
            const padded = padRight(hex, 4);
            expect(padded.startsWith("0x")).toBe(true);
            expect(padded.length % 2).toBe(0);
        });
        it("maintains original data at start", () => {
            const hex = "0x123456";
            const padded = padRight(hex, 8);
            expect(padded.startsWith("0x123456")).toBe(true);
        });
        it("appends zeros at end", () => {
            const hex = "0x12";
            const padded = padRight(hex, 4);
            expect(padded.slice(2, 4)).toBe("12");
            expect(padded.slice(4)).toBe("000000");
        });
    });
    describe("known encodings", () => {
        it("pads function selector", () => {
            const hex = "0xa9059cbb";
            const padded = padRight(hex, 32);
            expect(padded.startsWith("0xa9059cbb")).toBe(true);
            expect(padded.length).toBe(66);
        });
        it("pads partial address", () => {
            const hex = "0xd8da6bf2";
            const padded = padRight(hex, 20);
            expect(padded.startsWith("0xd8da6bf2")).toBe(true);
            expect(padded.length).toBe(42);
        });
        it("pads ASCII character", () => {
            const hex = "0x41"; // 'A'
            const padded = padRight(hex, 4);
            expect(padded).toBe("0x41000000");
        });
    });
    describe("type safety", () => {
        it("returns HexType branded string", () => {
            const hex = "0x12";
            const padded = padRight(hex, 4);
            expect(typeof padded).toBe("string");
            expect(padded.startsWith("0x")).toBe(true);
        });
        it("accepts any hex string", () => {
            const padded = padRight("0xabc", 4);
            expect(padded).toBe("0xabc00000");
        });
    });
    describe("size parameter validation", () => {
        it("throws InvalidSizeError for negative size", () => {
            const hex = "0x1234";
            expect(() => padRight(hex, -1)).toThrow(InvalidSizeError);
            expect(() => padRight(hex, -1)).toThrow(/Invalid target size: -1/);
        });
        it("throws InvalidSizeError for non-integer size", () => {
            const hex = "0x1234";
            expect(() => padRight(hex, 1.5)).toThrow(InvalidSizeError);
            expect(() => padRight(hex, 2.7)).toThrow(/Invalid target size: 2.7/);
        });
        it("throws InvalidSizeError for NaN", () => {
            const hex = "0x1234";
            expect(() => padRight(hex, NaN)).toThrow(InvalidSizeError);
            expect(() => padRight(hex, NaN)).toThrow(/Invalid target size: NaN/);
        });
        it("throws InvalidSizeError for Infinity", () => {
            const hex = "0x1234";
            expect(() => padRight(hex, Infinity)).toThrow(InvalidSizeError);
            expect(() => padRight(hex, -Infinity)).toThrow(InvalidSizeError);
        });
        it("accepts zero as valid size (returns original)", () => {
            const hex = "0x1234";
            expect(padRight(hex, 0)).toBe("0x1234");
        });
        it("error includes context with targetSize", () => {
            const hex = "0x1234";
            try {
                padRight(hex, -5);
            }
            catch (e) {
                expect(e).toBeInstanceOf(InvalidSizeError);
                expect(/** @type {InvalidSizeError} */ (e).context).toEqual({
                    targetSize: -5,
                });
            }
        });
    });
});
