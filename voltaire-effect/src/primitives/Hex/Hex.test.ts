import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
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
			const longHex = "0x" + "ab".repeat(1000);
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
			expect(() => S.decodeSync(Hex.String)(123 as unknown as string)).toThrow();
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
			const longHex = "0x" + "ab".repeat(500);
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

describe("pure functions", () => {
	describe("isHex", () => {
		it("returns true for valid hex with prefix", async () => {
			const result = await Effect.runPromise(Hex.isHex("0x1234"));
			expect(result).toBe(true);
		});

		it("returns false for empty hex 0x", async () => {
			const result = await Effect.runPromise(Hex.isHex("0x"));
			expect(result).toBe(false);
		});

		it("returns false for hex without prefix", async () => {
			const result = await Effect.runPromise(Hex.isHex("1234"));
			expect(result).toBe(false);
		});

		it("returns false for invalid hex characters", async () => {
			const result = await Effect.runPromise(Hex.isHex("0xZZZZ"));
			expect(result).toBe(false);
		});

		it("returns true for odd-length hex", async () => {
			const result = await Effect.runPromise(Hex.isHex("0xabc"));
			expect(result).toBe(true);
		});

		it("returns false for non-hex string", async () => {
			const result = await Effect.runPromise(Hex.isHex("hello"));
			expect(result).toBe(false);
		});
	});

	describe("isSized", () => {
		it("returns true for correct size", async () => {
			const hex = S.decodeSync(Hex.String)("0x1234");
			const result = await Effect.runPromise(Hex.isSized(hex, 2));
			expect(result).toBe(true);
		});

		it("returns false for incorrect size", async () => {
			const hex = S.decodeSync(Hex.String)("0x1234");
			const result = await Effect.runPromise(Hex.isSized(hex, 4));
			expect(result).toBe(false);
		});

		it("returns true for empty hex with size 0", async () => {
			const hex = S.decodeSync(Hex.String)("0x");
			const result = await Effect.runPromise(Hex.isSized(hex, 0));
			expect(result).toBe(true);
		});

		it("checks 32-byte hex correctly", async () => {
			const hex = S.decodeSync(Hex.String)("0x" + "ab".repeat(32));
			const result = await Effect.runPromise(Hex.isSized(hex, 32));
			expect(result).toBe(true);
		});
	});

	describe("clone", () => {
		it("creates a copy of hex", async () => {
			const original = S.decodeSync(Hex.String)("0xdeadbeef");
			const cloned = await Effect.runPromise(Hex.clone(original));
			expect(cloned).toBe(original);
		});

		it("clones empty hex", async () => {
			const original = S.decodeSync(Hex.String)("0x");
			const cloned = await Effect.runPromise(Hex.clone(original));
			expect(cloned).toBe("0x");
		});
	});

	describe("zero", () => {
		it("creates zero-filled hex of size 4", async () => {
			const result = await Effect.runPromise(Hex.zero(4));
			expect(result).toBe("0x00000000");
		});

		it("creates empty hex for size 0", async () => {
			const result = await Effect.runPromise(Hex.zero(0));
			expect(result).toBe("0x");
		});

		it("creates 32-byte zero hex", async () => {
			const result = await Effect.runPromise(Hex.zero(32));
			expect(result).toBe("0x" + "00".repeat(32));
			expect(result.length).toBe(66);
		});

		it("creates 1-byte zero hex", async () => {
			const result = await Effect.runPromise(Hex.zero(1));
			expect(result).toBe("0x00");
		});
	});

	describe("random", () => {
		it("generates random hex of correct size", async () => {
			const result = await Effect.runPromise(Hex.random(32));
			expect(result.length).toBe(66);
			expect(result.startsWith("0x")).toBe(true);
		});

		it("generates empty hex for size 0", async () => {
			const result = await Effect.runPromise(Hex.random(0));
			expect(result).toBe("0x");
		});

		it("generates different values each time", async () => {
			const a = await Effect.runPromise(Hex.random(16));
			const b = await Effect.runPromise(Hex.random(16));
			expect(a).not.toBe(b);
		});

		it("generates valid hex format", async () => {
			const result = await Effect.runPromise(Hex.random(8));
			expect(result).toMatch(/^0x[0-9a-f]{16}$/);
		});
	});
});

describe("edge cases", () => {
	it("handles maximum safe integer bytes", async () => {
		const hex = S.decodeSync(Hex.String)("0xffffffffffffff");
		const sized = await Effect.runPromise(Hex.isSized(hex, 7));
		expect(sized).toBe(true);
	});

	it("handles all zeros", () => {
		const hex = S.decodeSync(Hex.String)("0x0000000000");
		expect(hex).toBe("0x0000000000");
	});

	it("handles all ones (ff)", () => {
		const hex = S.decodeSync(Hex.String)("0xffffffffff");
		expect(hex).toBe("0xffffffffff");
	});

	it("preserves case for uppercase hex", () => {
		const hex = S.decodeSync(Hex.String)("0xABCDEF");
		expect(hex).toBe("0xABCDEF");
	});
});
