import { describe, expect, it } from "vitest";
import { decode } from "./decode.js";
import { encode } from "./encode.js";
import { RlpDecodingError } from "./RlpError.js";

const hex = (s: string) =>
	new Uint8Array(
		(s.match(/../g) ?? []).map((byte) => Number.parseInt(byte, 16)),
	);

describe("Rlp.decode validates canonical encoding at every depth", () => {
	it.each([
		["prefixed single byte in a list", "c28105", /should not be prefixed/],
		["long-form string under 56 bytes in a list", "c3b80105", /short form/],
		["long-form list with a zero length in a list", "c2f800", /leading zeros/],
		["long-form list under 56 bytes in a list", "c3f801c0", /short form/],
		["leading-zero string length in a list", "c4b9000105", /leading zeros/],
		[
			"prefixed single byte two lists deep",
			"c4c3c28105",
			/should not be prefixed/,
		],
		[
			"prefixed single byte after valid siblings",
			"c50102c28105",
			/should not be prefixed/,
		],
		["long-form r-like scalar b80101", "c3b80101", /short form/],
	])("rejects %s", (_name, encoded, message) => {
		expect(() => decode(hex(encoded))).toThrow(RlpDecodingError);
		expect(() => decode(hex(encoded))).toThrow(message);
		expect(() => decode(hex(encoded), true)).toThrow(RlpDecodingError);
	});

	it("rejects a child that overruns its parent list", () => {
		// List payload is 2 bytes, but the child string claims 3 payload bytes.
		// The buffer holds enough bytes, so only the parent bound catches it.
		expect(() => decode(hex("c283010203"), true)).toThrow(RlpDecodingError);
		expect(() => decode(hex("c3c283010203"), true)).toThrow(/Expected 4 bytes/);
		// Child list overruns its parent list.
		expect(() => decode(hex("c2c20101"), true)).toThrow(RlpDecodingError);
	});

	it("rejects a truncated nested long-form length", () => {
		expect(() => decode(hex("c1b8"))).toThrow(RlpDecodingError);
		expect(() => decode(hex("c1f9"))).toThrow(RlpDecodingError);
	});

	it("still decodes canonical nested data", () => {
		const long = new Uint8Array(60).fill(0x7f);
		const value = [
			new Uint8Array([5]),
			[new Uint8Array([0x80]), [new Uint8Array(0), long]],
			[],
		];
		const encoded = encode(value);
		const decoded = decode(encoded);
		expect(decoded.remainder.length).toBe(0);
		expect(encode(decoded.data)).toEqual(encoded);
		expect(decode(hex("c3c28180"))).toBeDefined();
	});

	it("keeps the stream remainder after a validated nested item", () => {
		const { data, remainder } = decode(hex("c2c1057f"), true);
		expect(data.type).toBe("list");
		expect(remainder).toEqual(hex("7f"));
	});
});
