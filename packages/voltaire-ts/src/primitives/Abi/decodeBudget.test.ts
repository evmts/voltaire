import { describe, expect, it } from "vitest";
import { decodeParameters } from "./decodeParameters.js";
import { createDecodeBudget, decodeValue } from "./decodeValue.js";
import { AbiDecodingError } from "./Errors.js";
import { encodeParameters } from "./encodeParameters.js";
import type { Parameter } from "./Parameter.js";

const decode = (params: readonly Parameter[], data: Uint8Array) =>
	decodeParameters(params as never, data) as unknown[];

/** Write `value` as a 32-byte big-endian word at `offset`. */
function word(data: Uint8Array, offset: number, value: number) {
	new DataView(data.buffer).setUint32(offset + 28, value);
}

/**
 * `count` top-level dynamic parameters whose head offsets all point at one
 * shared tail: a length word followed by `tail` payload bytes.
 */
function aliased(count: number, length: number, tail: Uint8Array) {
	const head = count * 32;
	const data = new Uint8Array(head + 32 + tail.length);
	for (let i = 0; i < count; i++) word(data, i * 32, head);
	word(data, head, length);
	data.set(tail, head + 32);
	return data;
}

describe("ABI decode budget is shared by all top-level parameters", () => {
	it("rejects top-level bytes parameters aliasing one large tail", () => {
		// 64 parameters x 64 KiB = 4 MiB of copies from a 66 KiB payload.
		const data = aliased(64, 65536, new Uint8Array(65536).fill(0xaa));
		const params = Array.from(
			{ length: 64 },
			() => ({ type: "bytes" }) as Parameter,
		);
		expect(() => decode(params, data)).toThrow(AbiDecodingError);
		expect(() => decode(params, data)).toThrow(/byte budget exceeded/);
		// One parameter reading the same tail is within the payload size.
		const single = aliased(1, 65536, new Uint8Array(65536).fill(0xaa));
		expect((decode([{ type: "bytes" }], single)[0] as Uint8Array).length).toBe(
			65536,
		);
	});

	it("rejects top-level string parameters aliasing one large tail", () => {
		const data = aliased(64, 65536, new Uint8Array(65536).fill(0x61));
		const params = Array.from(
			{ length: 64 },
			() => ({ type: "string" }) as Parameter,
		);
		expect(() => decode(params, data)).toThrow(/byte budget exceeded/);
	});

	it("rejects top-level arrays aliasing one tail past the element budget", () => {
		// 200 parameters x 1,000 elements = 200,000 values from a 38 KiB payload.
		// Each parameter alone is valid, so a per-parameter budget accepts this.
		const data = aliased(200, 1000, new Uint8Array(32 * 1000));
		const params = Array.from(
			{ length: 200 },
			() => ({ type: "uint256[]" }) as Parameter,
		);
		expect(() => decode(params, data)).toThrow(/element budget exceeded/);
		expect(
			(
				decode(
					[{ type: "uint256[]" }],
					aliased(1, 1000, new Uint8Array(32 * 1000)),
				)[0] as unknown[]
			).length,
		).toBe(1000);
	});

	it("rejects nested bytes[] elements aliasing one tail", () => {
		// bytes[] of 64 elements, every element offset pointing at one 4 KiB tail.
		const count = 64;
		const size = 4096;
		const data = new Uint8Array(32 + 32 + count * 32 + 32 + size);
		word(data, 0, 32);
		word(data, 32, count);
		for (let i = 0; i < count; i++) word(data, 64 + i * 32, count * 32);
		word(data, 64 + count * 32, size);
		expect(() => decode([{ type: "bytes[]" }], data)).toThrow(
			/byte budget exceeded/,
		);
	});

	it("charges bytesN copies", () => {
		const data = new Uint8Array(32).fill(0xff);
		const budget = { remainingElements: 10, remainingBytes: 31 };
		expect(() => decodeValue("bytes32", data, 0, undefined, budget)).toThrow(
			/byte budget exceeded/,
		);
		const exact = { remainingElements: 10, remainingBytes: 32 };
		decodeValue("bytes32", data, 0, undefined, exact);
		expect(exact).toEqual({ remainingElements: 9, remainingBytes: 0 });
	});

	it("one budget object is consumed across sequential decodeValue calls", () => {
		const data = encodeParameters(
			[{ type: "bytes" }, { type: "string" }] as never,
			[new Uint8Array(40).fill(1), "hello"] as never,
		);
		const budget = createDecodeBudget(data);
		expect(budget.remainingBytes).toBe(data.length);
		decodeValue("bytes", data, 0, undefined, budget);
		decodeValue("string", data, 32, undefined, budget);
		expect(budget.remainingBytes).toBe(data.length - 45);
		expect(budget.remainingElements).toBe(100_000 - 2);
	});

	it("canonical encodings never exceed the budget", () => {
		const params = [
			{ type: "bytes" },
			{ type: "string" },
			{ type: "bytes32[]" },
			{ type: "bytes[]" },
			{ type: "tuple", components: [{ type: "string" }, { type: "bytes4" }] },
			{ type: "uint256" },
		] as const;
		const values = [
			new Uint8Array(1000).fill(7),
			"x".repeat(999),
			[new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
			[
				new Uint8Array(0),
				new Uint8Array(33).fill(3),
				new Uint8Array(64).fill(4),
			],
			["tuple string", new Uint8Array(4).fill(5)],
			42n,
		];
		const data = encodeParameters(params as never, values as never);
		expect(decode(params, data)).toEqual(values);
	});
});
