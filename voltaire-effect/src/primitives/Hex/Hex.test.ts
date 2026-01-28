import { Effect, Exit } from "effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import type { HexType } from "@tevm/voltaire/Hex";
import * as Hex from "./index.js";

describe("Hex.String", () => {
	describe("decode", () => {
		it("parses valid lowercase hex", () => {
			const hex = S.decodeSync(Hex.String)("0xdeadbeef");
			expect(hex).toBe("0xdeadbeef");
		});

		it("parses valid uppercase hex", () => {
			const hex = S.decodeSync(Hex.String)("0xDEADBEEF");
			expect(hex).toBe("0xDEADBEEF");
		});

		it("parses mixed case hex", () => {
			const hex = S.decodeSync(Hex.String)("0xDeAdBeEf");
			expect(hex).toBe("0xDeAdBeEf");
		});

		it("parses empty hex 0x", () => {
			const hex = S.decodeSync(Hex.String)("0x");
			expect(hex).toBe("0x");
		});

		it("parses very long hex", () => {
			const longHex = `0x${"ab".repeat(1000)}`;
			const hex = S.decodeSync(Hex.String)(longHex);
			expect(hex.length).toBe(2002);
		});

		it("fails on hex without 0x prefix", () => {
			expect(() => S.decodeSync(Hex.String)("deadbeef")).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() => S.decodeSync(Hex.String)("0xZZZZ")).toThrow();
		});

		it("accepts odd-length hex after prefix", () => {
			const hex = S.decodeSync(Hex.String)("0xabc");
			expect(hex).toBe("0xabc");
		});

		it("fails on non-string input", () => {
			expect(() =>
				S.decodeSync(Hex.String)(123 as unknown as string),
			).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes preserving case", () => {
			const hex = S.decodeSync(Hex.String)("0xDEADBEEF");
			const encoded = S.encodeSync(Hex.String)(hex);
			expect(encoded).toBe("0xDEADBEEF");
		});

		it("encodes empty hex", () => {
			const hex = S.decodeSync(Hex.String)("0x");
			const encoded = S.encodeSync(Hex.String)(hex);
			expect(encoded).toBe("0x");
		});
	});

	describe("round-trip", () => {
		it("decode(encode(hex)) === hex", () => {
			const original = S.decodeSync(Hex.String)("0xdeadbeef");
			const encoded = S.encodeSync(Hex.String)(original);
			const decoded = S.decodeSync(Hex.String)(encoded);
			expect(decoded).toBe(original);
		});

		it("round-trips empty hex", () => {
			const original = S.decodeSync(Hex.String)("0x");
			const encoded = S.encodeSync(Hex.String)(original);
			const decoded = S.decodeSync(Hex.String)(encoded);
			expect(decoded).toBe(original);
		});

		it("round-trips very long hex", () => {
			const longHex = `0x${"ab".repeat(500)}`;
			const original = S.decodeSync(Hex.String)(longHex);
			const encoded = S.encodeSync(Hex.String)(original);
			const decoded = S.decodeSync(Hex.String)(encoded);
			expect(decoded).toBe(original);
		});
	});
});

describe("Hex.Bytes", () => {
	describe("decode", () => {
		it("parses bytes to hex", () => {
			const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const hex = S.decodeSync(Hex.Bytes)(bytes);
			expect(hex).toBe("0xdeadbeef");
		});

		it("parses empty bytes", () => {
			const bytes = new Uint8Array([]);
			const hex = S.decodeSync(Hex.Bytes)(bytes);
			expect(hex).toBe("0x");
		});

		it("parses single byte", () => {
			const bytes = new Uint8Array([0xff]);
			const hex = S.decodeSync(Hex.Bytes)(bytes);
			expect(hex).toBe("0xff");
		});

		it("parses zero bytes", () => {
			const bytes = new Uint8Array([0x00, 0x00]);
			const hex = S.decodeSync(Hex.Bytes)(bytes);
			expect(hex).toBe("0x0000");
		});

		it("parses long bytes", () => {
			const bytes = new Uint8Array(100).fill(0xab);
			const hex = S.decodeSync(Hex.Bytes)(bytes);
			expect(hex.length).toBe(202);
		});
	});

	describe("encode", () => {
		it("encodes hex to bytes", () => {
			const hex = S.decodeSync(Hex.String)("0xdeadbeef");
			const bytes = S.encodeSync(Hex.Bytes)(hex);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(4);
			expect(bytes[0]).toBe(0xde);
			expect(bytes[1]).toBe(0xad);
			expect(bytes[2]).toBe(0xbe);
			expect(bytes[3]).toBe(0xef);
		});

		it("encodes empty hex to empty bytes", () => {
			const hex = S.decodeSync(Hex.String)("0x");
			const bytes = S.encodeSync(Hex.Bytes)(hex);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(0);
		});
	});

	describe("round-trip", () => {
		it("decode(encode(hex)) preserves value", () => {
			const original = S.decodeSync(Hex.String)("0xdeadbeef");
			const bytes = S.encodeSync(Hex.Bytes)(original);
			const decoded = S.decodeSync(Hex.Bytes)(bytes);
			expect(decoded).toBe(original);
		});

		it("encode(decode(bytes)) preserves value", () => {
			const original = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const hex = S.decodeSync(Hex.Bytes)(original);
			const bytes = S.encodeSync(Hex.Bytes)(hex);
			expect(bytes).toEqual(original);
		});
	});
});

describe("pure functions (infallible)", () => {
	describe("isHex", () => {
		it("returns true for valid hex with prefix", () => {
			expect(Hex.isHex("0x1234")).toBe(true);
		});

		it("returns false for empty hex 0x", () => {
			expect(Hex.isHex("0x")).toBe(false);
		});

		it("returns false for hex without prefix", () => {
			expect(Hex.isHex("1234")).toBe(false);
		});

		it("returns false for invalid hex characters", () => {
			expect(Hex.isHex("0xZZZZ")).toBe(false);
		});

		it("returns true for odd-length hex", () => {
			expect(Hex.isHex("0xabc")).toBe(true);
		});
	});

	describe("isSized", () => {
		it("returns true for correct size", () => {
			const hex = S.decodeSync(Hex.String)("0x1234");
			expect(Hex.isSized(hex, 2)).toBe(true);
		});

		it("returns false for incorrect size", () => {
			const hex = S.decodeSync(Hex.String)("0x1234");
			expect(Hex.isSized(hex, 4)).toBe(false);
		});

		it("returns true for empty hex with size 0", () => {
			const hex = S.decodeSync(Hex.String)("0x");
			expect(Hex.isSized(hex, 0)).toBe(true);
		});

		it("checks 32-byte hex correctly", () => {
			const hex = S.decodeSync(Hex.String)(`0x${"ab".repeat(32)}`);
			expect(Hex.isSized(hex, 32)).toBe(true);
		});
	});

	describe("clone", () => {
		it("creates a copy of hex", () => {
			const original = S.decodeSync(Hex.String)("0xdeadbeef");
			const cloned = Hex.clone(original);
			expect(cloned).toBe(original);
		});

		it("clones empty hex", () => {
			const original = S.decodeSync(Hex.String)("0x");
			const cloned = Hex.clone(original);
			expect(cloned).toBe("0x");
		});
	});

	describe("zero", () => {
		it("creates zero-filled hex of size 4", () => {
			const result = Hex.zero(4);
			expect(result).toBe("0x00000000");
		});

		it("creates empty hex for size 0", () => {
			const result = Hex.zero(0);
			expect(result).toBe("0x");
		});

		it("creates 32-byte zero hex", () => {
			const result = Hex.zero(32);
			expect(result).toBe(`0x${"00".repeat(32)}`);
			expect(result.length).toBe(66);
		});
	});

	describe("random", () => {
		it("generates random hex of correct size", () => {
			const result = Hex.random(32);
			expect(result.length).toBe(66);
			expect(result.startsWith("0x")).toBe(true);
		});

		it("generates empty hex for size 0", () => {
			const result = Hex.random(0);
			expect(result).toBe("0x");
		});

		it("generates different values each time", () => {
			const a = Hex.random(16);
			const b = Hex.random(16);
			expect(a).not.toBe(b);
		});

		it("generates valid hex format", () => {
			const result = Hex.random(8);
			expect(result).toMatch(/^0x[0-9a-f]{16}$/);
		});
	});

	describe("equals", () => {
		it("returns true for equal hex", () => {
			const a = S.decodeSync(Hex.String)("0xdeadbeef");
			const b = S.decodeSync(Hex.String)("0xdeadbeef");
			expect(Hex.equals(a, b)).toBe(true);
		});

		it("returns false for different hex", () => {
			const a = S.decodeSync(Hex.String)("0xdeadbeef");
			const b = S.decodeSync(Hex.String)("0x12345678");
			expect(Hex.equals(a, b)).toBe(false);
		});
	});

	describe("size", () => {
		it("returns correct size for hex", () => {
			const hex = S.decodeSync(Hex.String)("0xdeadbeef");
			expect(Hex.size(hex)).toBe(4);
		});

		it("returns 0 for empty hex", () => {
			const hex = S.decodeSync(Hex.String)("0x");
			expect(Hex.size(hex)).toBe(0);
		});

		it("returns correct size for 32-byte hex", () => {
			const hex = S.decodeSync(Hex.String)(`0x${"ab".repeat(32)}`);
			expect(Hex.size(hex)).toBe(32);
		});
	});

	describe("trim", () => {
		it("trims leading zeros", () => {
			const hex = "0x00001234" as HexType;
			expect(Hex.trim(hex)).toBe("0x1234");
		});

		it("preserves non-zero hex", () => {
			const hex = "0xdeadbeef" as HexType;
			expect(Hex.trim(hex)).toBe("0xdeadbeef");
		});
	});

	describe("fromBoolean", () => {
		it("converts true to 0x01", () => {
			expect(Hex.fromBoolean(true)).toBe("0x01");
		});

		it("converts false to 0x00", () => {
			expect(Hex.fromBoolean(false)).toBe("0x00");
		});
	});

	describe("fromString", () => {
		it("encodes string to hex", () => {
			expect(Hex.fromString("hello")).toBe("0x68656c6c6f");
		});

		it("encodes empty string", () => {
			expect(Hex.fromString("")).toBe("0x");
		});
	});

	describe("toBigInt", () => {
		it("converts hex to bigint", () => {
			const hex = S.decodeSync(Hex.String)("0xff");
			expect(Hex.toBigInt(hex)).toBe(255n);
		});

		it("handles large values", () => {
			const hex = S.decodeSync(Hex.String)("0xde0b6b3a7640000");
			expect(Hex.toBigInt(hex)).toBe(1000000000000000000n);
		});
	});
});

describe("Effect functions (fallible)", () => {
	describe("from", () => {
		it("parses valid hex string", async () => {
			const result = await Effect.runPromise(Hex.from("0xdeadbeef"));
			expect(result).toBe("0xdeadbeef");
		});

		it("parses bytes", async () => {
			const result = await Effect.runPromise(
				Hex.from(new Uint8Array([0xde, 0xad])),
			);
			expect(result).toBe("0xdead");
		});

		it("fails on invalid hex", async () => {
			const exit = await Effect.runPromiseExit(Hex.from("invalid"));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("fromNumber", () => {
		it("converts number to hex", async () => {
			const result = await Effect.runPromise(Hex.fromNumber(255));
			expect(result).toBe("0xff");
		});

		it("pads to size", async () => {
			const result = await Effect.runPromise(Hex.fromNumber(255, 2));
			expect(result).toBe("0x00ff");
		});

		it("fails on negative number", async () => {
			const exit = await Effect.runPromiseExit(Hex.fromNumber(-1));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("fromBigInt", () => {
		it("converts bigint to hex", async () => {
			const result = await Effect.runPromise(Hex.fromBigInt(255n));
			expect(result).toBe("0xff");
		});

		it("pads to size", async () => {
			const result = await Effect.runPromise(Hex.fromBigInt(255n, 2));
			expect(result).toBe("0x00ff");
		});

		it("fails on negative bigint", async () => {
			const exit = await Effect.runPromiseExit(Hex.fromBigInt(-1n));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("toNumber", () => {
		it("converts hex to number", async () => {
			const hex = S.decodeSync(Hex.String)("0xff");
			const result = await Effect.runPromise(Hex.toNumber(hex));
			expect(result).toBe(255);
		});
	});

	describe("toBoolean", () => {
		it("converts 0x01 to true", async () => {
			const hex = "0x01" as HexType;
			const result = await Effect.runPromise(Hex.toBoolean(hex));
			expect(result).toBe(true);
		});

		it("converts 0x00 to false", async () => {
			const hex = "0x00" as HexType;
			const result = await Effect.runPromise(Hex.toBoolean(hex));
			expect(result).toBe(false);
		});

		it("fails on invalid boolean hex", async () => {
			const hex = "0xff" as HexType;
			const exit = await Effect.runPromiseExit(Hex.toBoolean(hex));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("toStringHex", () => {
		it("decodes hex to string", async () => {
			const hex = "0x68656c6c6f" as HexType;
			const result = await Effect.runPromise(Hex.toStringHex(hex));
			expect(result).toBe("hello");
		});
	});

	describe("concat", () => {
		it("concatenates hex strings", async () => {
			const a = "0x1234" as HexType;
			const b = "0x5678" as HexType;
			const result = await Effect.runPromise(Hex.concat(a, b));
			expect(result).toBe("0x12345678");
		});

		it("concatenates multiple hex strings", async () => {
			const a = "0x12" as HexType;
			const b = "0x34" as HexType;
			const c = "0x56" as HexType;
			const result = await Effect.runPromise(Hex.concat(a, b, c));
			expect(result).toBe("0x123456");
		});
	});

	describe("pad", () => {
		it("left-pads hex to size", async () => {
			const hex = "0x12" as HexType;
			const result = await Effect.runPromise(Hex.pad(hex, 4));
			expect(result).toBe("0x00000012");
		});

		it("fails when hex exceeds target size", async () => {
			const hex = "0x12345678" as HexType;
			const exit = await Effect.runPromiseExit(Hex.pad(hex, 2));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("padRight", () => {
		it("right-pads hex to size", async () => {
			const hex = "0x12" as HexType;
			const result = await Effect.runPromise(Hex.padRight(hex, 4));
			expect(result).toBe("0x12000000");
		});
	});

	describe("slice", () => {
		it("slices hex from start", async () => {
			const hex = "0x123456" as HexType;
			const result = await Effect.runPromise(Hex.slice(hex, 1));
			expect(result).toBe("0x3456");
		});

		it("slices hex with range", async () => {
			const hex = "0x123456" as HexType;
			const result = await Effect.runPromise(Hex.slice(hex, 0, 1));
			expect(result).toBe("0x12");
		});
	});

	describe("validate", () => {
		it("validates valid hex", async () => {
			const result = await Effect.runPromise(Hex.validate("0x1234"));
			expect(result).toBe("0x1234");
		});

		it("fails on invalid hex", async () => {
			const exit = await Effect.runPromiseExit(Hex.validate("invalid"));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("xor", () => {
		it("xors two hex strings", async () => {
			const a = "0xff00" as HexType;
			const b = "0x00ff" as HexType;
			const result = await Effect.runPromise(Hex.xor(a, b));
			expect(result).toBe("0xffff");
		});
	});

	describe("assertSize", () => {
		it("succeeds when size matches", async () => {
			const hex = "0x1234" as HexType;
			const result = await Effect.runPromise(Hex.assertSize(hex, 2));
			expect(result).toBe("0x1234");
		});

		it("fails when size doesn't match", async () => {
			const hex = "0x1234" as HexType;
			const exit = await Effect.runPromiseExit(Hex.assertSize(hex, 4));
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});
});

describe("API consistency", () => {
	it("infallible ops return directly, not Effect", () => {
		const hex = S.decodeSync(Hex.String)("0xdeadbeef");

		expect(typeof Hex.clone(hex)).toBe("string");
		expect(typeof Hex.isHex("0x1234")).toBe("boolean");
		expect(typeof Hex.isSized(hex, 4)).toBe("boolean");
		expect(typeof Hex.zero(4)).toBe("string");
		expect(typeof Hex.random(8)).toBe("string");
		expect(typeof Hex.equals(hex, hex)).toBe("boolean");
		expect(typeof Hex.size(hex)).toBe("number");
		expect(typeof Hex.trim(hex)).toBe("string");
		expect(typeof Hex.fromBoolean(true)).toBe("string");
		expect(typeof Hex.fromString("hello")).toBe("string");
	});
});

describe("error cases", () => {
	describe("Hex.String errors", () => {
		it("fails on null", () => {
			expect(() =>
				S.decodeSync(Hex.String)(null as unknown as string),
			).toThrow();
		});

		it("fails on undefined", () => {
			expect(() =>
				S.decodeSync(Hex.String)(undefined as unknown as string),
			).toThrow();
		});

		it("fails on object", () => {
			expect(() => S.decodeSync(Hex.String)({} as unknown as string)).toThrow();
		});

		it("fails on array", () => {
			expect(() => S.decodeSync(Hex.String)([] as unknown as string)).toThrow();
		});

		it("fails on empty string", () => {
			expect(() => S.decodeSync(Hex.String)("")).toThrow();
		});

		it("fails on whitespace", () => {
			expect(() => S.decodeSync(Hex.String)("  ")).toThrow();
		});

		it("fails on 0x with spaces", () => {
			expect(() => S.decodeSync(Hex.String)("0x 12")).toThrow();
		});

		it("fails on special characters", () => {
			expect(() => S.decodeSync(Hex.String)("0x!@#$")).toThrow();
		});
	});

	describe("Hex.Bytes errors", () => {
		it("fails on null", () => {
			expect(() =>
				S.decodeSync(Hex.Bytes)(null as unknown as Uint8Array),
			).toThrow();
		});

		it("fails on string input", () => {
			expect(() =>
				S.decodeSync(Hex.Bytes)("0xab" as unknown as Uint8Array),
			).toThrow();
		});
	});
});
