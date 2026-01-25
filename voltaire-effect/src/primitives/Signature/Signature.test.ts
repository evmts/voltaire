import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as Signature from "./index.js";

const validR = "ab".repeat(32);
const validS = "cd".repeat(32);
const validSig65 = `0x${validR}${validS}1b`;
const validSig64 = `0x${validR}${validS}`;

describe("Signature.Hex", () => {
	describe("decode", () => {
		it("parses 65-byte signature (stored as 64 with algorithm)", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig65);
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBeGreaterThanOrEqual(64);
		});

		it("parses 64-byte signature without recovery", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig64);
			expect(sig).toBeInstanceOf(Uint8Array);
			expect(sig.length).toBe(64);
		});

		it("fails on wrong length (too short)", () => {
			expect(() => S.decodeSync(Signature.Hex)("0x1234")).toThrow();
		});

		it("fails on wrong length (too long)", () => {
			expect(() =>
				S.decodeSync(Signature.Hex)(`0x${validR}${validS}1b0000`),
			).toThrow();
		});

		it("fails on invalid hex characters", () => {
			expect(() =>
				S.decodeSync(Signature.Hex)(`0x${"gg".repeat(32)}${validS}1b`),
			).toThrow();
		});

		it("fails on empty string", () => {
			expect(() => S.decodeSync(Signature.Hex)("")).toThrow();
		});

		it("fails on just prefix", () => {
			expect(() => S.decodeSync(Signature.Hex)("0x")).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to lowercase hex with prefix", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig64);
			const hex = S.encodeSync(Signature.Hex)(sig);
			expect(hex.startsWith("0x")).toBe(true);
			expect(hex).toBe(hex.toLowerCase());
		});

		it("round-trips correctly", () => {
			const original = S.decodeSync(Signature.Hex)(validSig64);
			const encoded = S.encodeSync(Signature.Hex)(original);
			const decoded = S.decodeSync(Signature.Hex)(encoded);
			expect(Signature.is(decoded)).toBe(true);
			expect(decoded.length).toBe(original.length);
		});
	});
});

describe("Signature.Bytes", () => {
	describe("decode", () => {
		it("parses 65-byte array (extracts 64 bytes)", () => {
			const bytes = new Uint8Array(65).fill(0xab);
			bytes[64] = 27;
			const sig = S.decodeSync(Signature.Bytes)(bytes);
			expect(sig.length).toBeGreaterThanOrEqual(64);
		});

		it("parses 64-byte array", () => {
			const bytes = new Uint8Array(64).fill(0xab);
			const sig = S.decodeSync(Signature.Bytes)(bytes);
			expect(sig.length).toBe(64);
		});

		it("fails on 63 bytes", () => {
			const bytes = new Uint8Array(63);
			expect(() => S.decodeSync(Signature.Bytes)(bytes)).toThrow();
		});

		it("fails on 66 bytes", () => {
			const bytes = new Uint8Array(66);
			expect(() => S.decodeSync(Signature.Bytes)(bytes)).toThrow();
		});

		it("fails on empty array", () => {
			expect(() => S.decodeSync(Signature.Bytes)(new Uint8Array())).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to Uint8Array", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig64);
			const bytes = S.encodeSync(Signature.Bytes)(sig);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBeGreaterThanOrEqual(64);
		});
	});
});

describe("Signature.Compact", () => {
	describe("decode", () => {
		it("parses 64-byte compact signature", () => {
			const bytes = new Uint8Array(64).fill(0xab);
			const sig = S.decodeSync(Signature.Compact)(bytes);
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("fails on 63 bytes", () => {
			const bytes = new Uint8Array(63);
			expect(() => S.decodeSync(Signature.Compact)(bytes)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to 64-byte compact format", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig64);
			const compact = S.encodeSync(Signature.Compact)(sig);
			expect(compact).toBeInstanceOf(Uint8Array);
			expect(compact.length).toBe(64);
		});
	});
});

describe("Signature.DER", () => {
	const validDER = new Uint8Array([
		0x30, 0x44, 0x02, 0x20, ...new Uint8Array(32).fill(0x01), 0x02, 0x20,
		...new Uint8Array(32).fill(0x02),
	]);

	describe("decode", () => {
		it("parses valid DER signature", () => {
			const sig = S.decodeSync(Signature.DER)(validDER);
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("fails on invalid DER (wrong tag)", () => {
			const invalid = new Uint8Array(validDER);
			invalid[0] = 0x31;
			expect(() => S.decodeSync(Signature.DER)(invalid)).toThrow();
		});

		it("fails on too short", () => {
			const bytes = new Uint8Array([0x30, 0x06]);
			expect(() => S.decodeSync(Signature.DER)(bytes)).toThrow();
		});

		it("fails on empty", () => {
			expect(() => S.decodeSync(Signature.DER)(new Uint8Array())).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to DER format", () => {
			const sig = S.decodeSync(Signature.DER)(validDER);
			const der = S.encodeSync(Signature.DER)(sig);
			expect(der).toBeInstanceOf(Uint8Array);
			expect(der[0]).toBe(0x30);
		});
	});
});

describe("Signature.Rpc", () => {
	describe("decode", () => {
		it("parses RPC format with yParity string", () => {
			const sig = S.decodeSync(Signature.Rpc)({
				r: `0x${validR}`,
				s: `0x${validS}`,
				yParity: "0x0",
			});
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("parses RPC format with yParity number", () => {
			const sig = S.decodeSync(Signature.Rpc)({
				r: `0x${validR}`,
				s: `0x${validS}`,
				yParity: 0,
			});
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("parses RPC format with v string", () => {
			const sig = S.decodeSync(Signature.Rpc)({
				r: `0x${validR}`,
				s: `0x${validS}`,
				v: "0x1b",
			});
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("parses RPC format with v number", () => {
			const sig = S.decodeSync(Signature.Rpc)({
				r: `0x${validR}`,
				s: `0x${validS}`,
				v: 27,
			});
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("fails on missing r", () => {
			expect(() =>
				S.decodeSync(Signature.Rpc)({
					s: `0x${validS}`,
					yParity: 0,
				} as { r: string; s: string }),
			).toThrow();
		});

		it("fails on missing s", () => {
			expect(() =>
				S.decodeSync(Signature.Rpc)({
					r: `0x${validR}`,
					yParity: 0,
				} as { r: string; s: string }),
			).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to RPC format", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig64);
			const rpc = S.encodeSync(Signature.Rpc)(sig);
			expect(rpc).toHaveProperty("r");
			expect(rpc).toHaveProperty("s");
			expect(typeof rpc.r).toBe("string");
			expect(typeof rpc.s).toBe("string");
		});
	});
});

describe("Signature.Tuple", () => {
	describe("decode", () => {
		it("parses tuple [yParity, r, s]", () => {
			const r = new Uint8Array(32).fill(0xab);
			const s = new Uint8Array(32).fill(0xcd);
			const sig = S.decodeSync(Signature.Tuple)([0, r, s]);
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("parses tuple with yParity=1", () => {
			const r = new Uint8Array(32).fill(0xab);
			const s = new Uint8Array(32).fill(0xcd);
			const sig = S.decodeSync(Signature.Tuple)([1, r, s]);
			expect(sig).toBeInstanceOf(Uint8Array);
		});

		it("fails on wrong r length", () => {
			const r = new Uint8Array(31);
			const s = new Uint8Array(32);
			expect(() => S.decodeSync(Signature.Tuple)([0, r, s])).toThrow();
		});

		it("fails on wrong s length", () => {
			const r = new Uint8Array(32);
			const s = new Uint8Array(31);
			expect(() => S.decodeSync(Signature.Tuple)([0, r, s])).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes to tuple format", () => {
			const sig = S.decodeSync(Signature.Hex)(validSig65);
			const tuple = S.encodeSync(Signature.Tuple)(sig);
			expect(Array.isArray(tuple)).toBe(true);
			expect(tuple.length).toBe(3);
			expect(typeof tuple[0]).toBe("number");
			expect(tuple[1]).toBeInstanceOf(Uint8Array);
			expect(tuple[2]).toBeInstanceOf(Uint8Array);
		});
	});
});

describe("pure functions", () => {
	const sig = S.decodeSync(Signature.Hex)(validSig65);
	const sig2 = S.decodeSync(Signature.Hex)(validSig65);
	const differentSig = S.decodeSync(Signature.Hex)(
		`0x${"11".repeat(32)}${"22".repeat(32)}1c`,
	);

	describe("is", () => {
		it("returns true for valid signature", () => {
			expect(Signature.is(sig)).toBe(true);
		});

		it("returns false for plain Uint8Array", () => {
			expect(Signature.is(new Uint8Array(65))).toBe(false);
		});

		it("returns false for non-Uint8Array", () => {
			expect(Signature.is("not a signature")).toBe(false);
			expect(Signature.is(123)).toBe(false);
			expect(Signature.is(null)).toBe(false);
			expect(Signature.is(undefined)).toBe(false);
			expect(Signature.is({})).toBe(false);
		});
	});

	describe("isSignature", () => {
		it("is alias for is", () => {
			expect(Signature.isSignature(sig)).toBe(true);
			expect(Signature.isSignature(new Uint8Array(65))).toBe(false);
		});
	});

	describe("getAlgorithm", () => {
		it("returns secp256k1 for Ethereum signatures", () => {
			expect(Signature.getAlgorithm(sig)).toBe("secp256k1");
		});
	});

	describe("isCanonical", () => {
		it("returns boolean", () => {
			const result = Signature.isCanonical(sig);
			expect(typeof result).toBe("boolean");
		});
	});

	describe("normalize", () => {
		it("returns a signature", () => {
			const normalized = Signature.normalize(sig);
			expect(Signature.is(normalized)).toBe(true);
		});

		it("normalizes non-canonical signatures", () => {
			const normalized = Signature.normalize(sig);
			expect(Signature.isCanonical(normalized)).toBe(true);
		});
	});

	describe("toCompact", () => {
		it("returns 64-byte compact format", () => {
			const compact = Signature.toCompact(sig);
			expect(compact).toBeInstanceOf(Uint8Array);
			expect(compact.length).toBe(64);
		});
	});
});

describe("edge cases", () => {
	it("handles all-zeros signature", () => {
		const zeroBytes = new Uint8Array(64);
		const sig = S.decodeSync(Signature.Bytes)(zeroBytes);
		expect(sig.length).toBe(64);
	});

	it("handles max value bytes", () => {
		const maxBytes = new Uint8Array(64).fill(0xff);
		const sig = S.decodeSync(Signature.Bytes)(maxBytes);
		expect(sig.length).toBe(64);
	});

	it("handles valid v values in 65-byte input", () => {
		const bytes27 = new Uint8Array(65).fill(0xab);
		bytes27[64] = 27;
		const sig27 = S.decodeSync(Signature.Bytes)(bytes27);
		expect(sig27.length).toBeGreaterThanOrEqual(64);

		const bytes28 = new Uint8Array(65).fill(0xab);
		bytes28[64] = 28;
		const sig28 = S.decodeSync(Signature.Bytes)(bytes28);
		expect(sig28.length).toBeGreaterThanOrEqual(64);
	});
});
