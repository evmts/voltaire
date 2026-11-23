import { describe, expect, it } from "vitest";
import { decodeParameters } from "./decodeParameters.js";
import { decodeValue } from "./decodeValue.js";
import { AbiDecodingError } from "./Errors.js";
import { encodeParameters } from "./encodeParameters.js";
import type { Parameter } from "./Parameter.js";

/** Build calldata from 32-byte words given as hex (no 0x). */
function words(...ws: string[]): Uint8Array {
	const out = new Uint8Array(ws.length * 32);
	ws.forEach((w, i) => {
		const padded = w.padStart(64, "0");
		for (let j = 0; j < 32; j++) {
			out[i * 32 + j] = Number.parseInt(padded.slice(j * 2, j * 2 + 2), 16);
		}
	});
	return out;
}

const decode = (params: readonly Parameter[], data: Uint8Array) =>
	decodeParameters(params as never, data) as unknown[];

describe("decodeValue dynamic array bounds", () => {
	it("rejects the 68-byte DoS payload (offset 0x20, length 0x80000000) without allocating", () => {
		const data = new Uint8Array(68);
		data.set(words("20", "80000000"), 0);
		expect(data.length).toBe(68);
		expect(() => decode([{ type: "uint256[]" }], data)).toThrow(
			AbiDecodingError,
		);
		expect(() => decode([{ type: "uint256[]" }], data)).toThrow(
			/exceeds remaining payload/,
		);
	});

	it("rejects an array data offset past the end", () => {
		expect(() => decode([{ type: "uint256[]" }], words("1000"))).toThrow(
			/out of bounds/,
		);
	});

	it("bounds dynamic-element arrays by one head word per element", () => {
		// string[] with length 3 but only 2 head words left
		expect(() =>
			decode([{ type: "string[]" }], words("20", "3", "0", "0")),
		).toThrow(/exceeds remaining payload/);
	});

	it("bounds static tuple elements by their full static size", () => {
		const params = [
			{
				type: "tuple[]",
				components: [{ type: "uint256" }, { type: "uint256" }],
			},
		] as const;
		// length 2 needs 4 words; only 3 present
		expect(() => decode(params, words("20", "2", "1", "2", "3"))).toThrow(
			/exceeds remaining payload/,
		);
	});

	it("caps zero-size element arrays", () => {
		const params = [{ type: "tuple[]", components: [] }] as const;
		expect(() => decode(params, words("20", "100000"))).toThrow(
			/exceeds remaining payload/,
		);
		expect(decode(params, words("20", "2"))).toEqual([[[], []]]);
	});

	it("still decodes valid arrays exactly filling the payload", () => {
		const data = encodeParameters(
			[{ type: "uint256[]" }] as never,
			[[1n, 2n, 3n]] as never,
		);
		expect(decode([{ type: "uint256[]" }], data)).toEqual([[1n, 2n, 3n]]);
	});

	it("shares the element budget across nested arrays", () => {
		const value = [
			[1n, 2n],
			[3n, 4n],
		];
		const data = encodeParameters(
			[{ type: "uint256[][]" }] as never,
			[value] as never,
		);
		expect(decode([{ type: "uint256[][]" }], data)).toEqual([value]);
		expect(
			decodeValue("uint256[][]", data, 0, undefined, {
				remainingElements: 7,
				remainingBytes: data.length,
			}).value,
		).toEqual(value);
		expect(() =>
			decodeValue("uint256[][]", data, 0, undefined, {
				remainingElements: 6,
				remainingBytes: data.length,
			}),
		).toThrow(AbiDecodingError);
	});
});

describe("decodeValue strict canonical encoding", () => {
	it("bool accepts only 0 and 1", () => {
		expect(decode([{ type: "bool" }], words("0"))).toEqual([false]);
		expect(decode([{ type: "bool" }], words("1"))).toEqual([true]);
		expect(() => decode([{ type: "bool" }], words("2"))).toThrow(
			/Non-canonical bool/,
		);
		expect(() =>
			decode([{ type: "bool" }], words(`01${"00".repeat(30)}01`)),
		).toThrow(AbiDecodingError);
	});

	it("intN requires sign extension", () => {
		expect(decode([{ type: "int8" }], words("7f"))).toEqual([127n]);
		expect(decode([{ type: "int8" }], words(`${"f".repeat(62)}80`))).toEqual([
			-128n,
		]);
		// 0x80 without sign extension
		expect(() => decode([{ type: "int8" }], words("80"))).toThrow(
			/Non-canonical int8/,
		);
		// positive value with dirty high bits
		expect(() =>
			decode([{ type: "int8" }], words(`1${"0".repeat(61)}01`)),
		).toThrow(AbiDecodingError);
		// negative value with a zero in the extension
		expect(() =>
			decode([{ type: "int16" }], words(`7${"f".repeat(59)}ffff`)),
		).toThrow(AbiDecodingError);
		expect(decode([{ type: "int256" }], words("f".repeat(64)))).toEqual([-1n]);
	});

	it("intN round-trips encoder output at extremes", () => {
		for (const [type, v] of [
			["int8", -128n],
			["int8", 127n],
			["int24", -1n],
			["int128", -(2n ** 127n)],
			["int248", 2n ** 247n - 1n],
		] as const) {
			const data = encodeParameters([{ type }] as never, [v] as never);
			expect(decode([{ type }], data)).toEqual([v]);
		}
	});

	it("bytesN requires zero right padding", () => {
		expect(
			decode([{ type: "bytes4" }], words(`deadbeef${"0".repeat(56)}`)),
		).toEqual([new Uint8Array([0xde, 0xad, 0xbe, 0xef])]);
		expect(() =>
			decode([{ type: "bytes4" }], words(`deadbeef${"0".repeat(55)}1`)),
		).toThrow(/Non-canonical bytes4/);
		expect(
			decode([{ type: "bytes32" }], words("f".repeat(64)))[0],
		).toHaveLength(32);
	});

	it("address requires zero left padding", () => {
		const addr = "11".repeat(20);
		expect(decode([{ type: "address" }], words(addr))).toEqual([`0x${addr}`]);
		expect(() =>
			decode([{ type: "address" }], words(`01${"0".repeat(22)}${addr}`)),
		).toThrow(AbiDecodingError);
	});

	it("function decodes as right-aligned bytes24", () => {
		const fn = `${"11".repeat(20)}a9059cbb`;
		const [value] = decode(
			[{ type: "function" as never }],
			words(`${fn}${"0".repeat(16)}`),
		);
		expect(value).toHaveLength(24);
		expect(() =>
			decode([{ type: "function" as never }], words(`${fn}${"0".repeat(15)}1`)),
		).toThrow(/Non-canonical function/);
	});
});
