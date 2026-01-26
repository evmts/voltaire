import * as Effect from "effect/Effect";
import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as PublicKey from "./index.js";

const validUncompressedHex = `0x${"ab".repeat(64)}`;

describe("PublicKey.Hex", () => {
	describe("decode", () => {
		it("parses 128-char uncompressed hex", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(64);
		});

		it("fails on wrong length (too short)", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("0x1234")).toThrow();
		});

		it("fails on wrong length (odd chars)", () => {
			expect(() => S.decodeSync(PublicKey.Hex)(`0x${"ab".repeat(31)}a`)).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() =>
				S.decodeSync(PublicKey.Hex)(`0x${"gg".repeat(64)}`),
			).toThrow();
		});

		it("fails on empty string", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("")).toThrow();
		});

		it("fails on just prefix", () => {
			expect(() => S.decodeSync(PublicKey.Hex)("0x")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex with prefix", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const hex = S.encodeSync(PublicKey.Hex)(pk);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex.length).toBe(130);
		});

		it("round-trips correctly", () => {
			const original = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const encoded = S.encodeSync(PublicKey.Hex)(original);
			const decoded = S.decodeSync(PublicKey.Hex)(encoded);
			expect(decoded.length).toBe(original.length);
			expect([...decoded]).toEqual([...original]);
		});
	});
});

describe("PublicKey.Bytes", () => {
	describe("decode", () => {
		it("parses 64-byte uncompressed array", () => {
			const bytes = new Uint8Array(64).fill(0xab);
			const pk = S.decodeSync(PublicKey.Bytes)(bytes);
			expect(pk.length).toBe(64);
		});

		it("parses 33-byte compressed array and decompresses", () => {
			const compressed = new Uint8Array(33);
			compressed[0] = 0x02;
			compressed.fill(0xab, 1);
			const pk = S.decodeSync(PublicKey.Bytes)(compressed);
			expect(pk.length).toBe(64);
		});

		it("fails on wrong length (32 bytes)", () => {
			const bytes = new Uint8Array(32);
			expect(() => S.decodeSync(PublicKey.Bytes)(bytes)).toThrow();
		});

		it("fails on wrong length (65 bytes)", () => {
			const bytes = new Uint8Array(65);
			expect(() => S.decodeSync(PublicKey.Bytes)(bytes)).toThrow();
		});

		it("fails on empty array", () => {
			expect(() => S.decodeSync(PublicKey.Bytes)(new Uint8Array())).toThrow();
		});

		it("fails on 1-byte array", () => {
			expect(() =>
				S.decodeSync(PublicKey.Bytes)(new Uint8Array([0x02])),
			).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to 64-byte Uint8Array", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const bytes = S.encodeSync(PublicKey.Bytes)(pk);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(64);
		});
	});
});

describe("PublicKey.Compressed", () => {
	describe("decode", () => {
		it("parses compressed hex with 0x02 prefix", () => {
			const pk = S.decodeSync(PublicKey.Compressed)(validCompressedHex);
			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(64);
		});

		it("parses compressed hex with 0x03 prefix", () => {
			const hex03 = `0x03${"ab".repeat(32)}`;
			const pk = S.decodeSync(PublicKey.Compressed)(hex03);
			expect(pk.length).toBe(64);
		});

		it("parses uncompressed hex too", () => {
			const pk = S.decodeSync(PublicKey.Compressed)(validUncompressedHex);
			expect(pk.length).toBe(64);
		});

		it("fails on invalid prefix", () => {
			const badPrefix = `0x05${"ab".repeat(32)}`;
			expect(() => S.decodeSync(PublicKey.Compressed)(badPrefix)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to compressed hex (66 chars)", () => {
			const pk = S.decodeSync(PublicKey.Hex)(validUncompressedHex);
			const compressed = S.encodeSync(PublicKey.Compressed)(pk);
			expect(compressed.startsWith("0x02") || compressed.startsWith("0x03")).toBe(
				true,
			);
			expect(compressed.length).toBe(68);
		});
	});
});

describe("effect-wrapped functions", () => {
	describe("isCompressed", () => {
		it("returns true for 33-byte with 0x02 prefix", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x02;
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(true);
		});

		it("returns true for 33-byte with 0x03 prefix", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x03;
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(true);
		});

		it("returns false for 64-byte uncompressed", async () => {
			const bytes = new Uint8Array(64);
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(false);
		});

		it("returns false for wrong length", async () => {
			const bytes = new Uint8Array(32);
			const result = await Effect.runPromise(PublicKey.isCompressed(bytes));
			expect(result).toBe(false);
		});
	});

	describe("isValid", () => {
		it("returns true for valid uncompressed hex", async () => {
			const result = await Effect.runPromise(
				PublicKey.isValid(validUncompressedHex),
			);
			expect(result).toBe(true);
		});

		it("returns true for 64-byte array", async () => {
			const bytes = new Uint8Array(64);
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(true);
		});

		it("returns true for 33-byte compressed array", async () => {
			const bytes = new Uint8Array(33);
			bytes[0] = 0x02;
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(true);
		});

		it("returns false for wrong hex length", async () => {
			const result = await Effect.runPromise(PublicKey.isValid("0x1234"));
			expect(result).toBe(false);
		});

		it("returns false for wrong byte length", async () => {
			const bytes = new Uint8Array(32);
			const result = await Effect.runPromise(PublicKey.isValid(bytes));
			expect(result).toBe(false);
		});

		it("returns false for invalid hex chars", async () => {
			const result = await Effect.runPromise(
				PublicKey.isValid(`0x${"gg".repeat(64)}`),
			);
			expect(result).toBe(false);
		});
	});
});

describe("edge cases", () => {
	it("handles all-zeros public key", () => {
		const zeroBytes = new Uint8Array(64);
		const pk = S.decodeSync(PublicKey.Bytes)(zeroBytes);
		expect(pk.length).toBe(64);
	});

	it("handles max value bytes", () => {
		const maxBytes = new Uint8Array(64).fill(0xff);
		const pk = S.decodeSync(PublicKey.Bytes)(maxBytes);
		expect(pk.length).toBe(64);
	});

	it("handles mixed case hex", () => {
		const mixedCase = `0x${"Ab".repeat(64)}`;
		const pk = S.decodeSync(PublicKey.Hex)(mixedCase);
		expect(pk.length).toBe(64);
	});

	it("handles hex without 0x prefix via isValid", async () => {
		const noPrefix = "ab".repeat(64);
		const result = await Effect.runPromise(PublicKey.isValid(noPrefix));
		expect(result).toBe(true);
	});
});
