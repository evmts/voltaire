import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import * as Rlp from "./index.js";

type Encodable = Uint8Array | Encodable[];

describe("Rlp encode", () => {
	describe("single byte encoding", () => {
		it("encodes single byte 0x00 as itself", () => {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([0x00])));
			expect(encoded).toEqual(new Uint8Array([0x00]));
		});

		it("encodes single byte < 0x80 as itself", () => {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([0x7f])));
			expect(encoded).toEqual(new Uint8Array([0x7f]));
		});

		it("encodes single byte 0x80 with prefix", () => {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([0x80])));
			expect(encoded).toEqual(new Uint8Array([0x81, 0x80]));
		});
	});

	describe("short bytes (0-55 bytes)", () => {
		it("encodes empty bytes as 0x80", () => {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array(0)));
			expect(encoded).toEqual(new Uint8Array([0x80]));
		});

		it("encodes 2 bytes with prefix 0x82", () => {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([0x01, 0x02])));
			expect(encoded).toEqual(new Uint8Array([0x82, 0x01, 0x02]));
		});

		it("encodes 55 bytes with prefix 0xb7", () => {
			const data = new Uint8Array(55).fill(0xab);
			const encoded = Effect.runSync(Rlp.encode(data));
			expect(encoded[0]).toBe(0xb7);
			expect(encoded.length).toBe(56);
		});
	});

	describe("long bytes (> 55 bytes)", () => {
		it("encodes 56 bytes with length prefix", () => {
			const data = new Uint8Array(56).fill(0xab);
			const encoded = Effect.runSync(Rlp.encode(data));
			expect(encoded[0]).toBe(0xb8);
			expect(encoded[1]).toBe(56);
			expect(encoded.length).toBe(58);
		});

		it("encodes 256 bytes with 2-byte length prefix", () => {
			const data = new Uint8Array(256).fill(0xab);
			const encoded = Effect.runSync(Rlp.encode(data));
			expect(encoded[0]).toBe(0xb9);
			expect(encoded[1]).toBe(0x01);
			expect(encoded[2]).toBe(0x00);
			expect(encoded.length).toBe(259);
		});

		it("encodes 1024 bytes correctly", () => {
			const data = new Uint8Array(1024).fill(0xcd);
			const encoded = Effect.runSync(Rlp.encode(data));
			expect(encoded[0]).toBe(0xb9);
			expect(encoded.length).toBe(1027);
		});
	});

	describe("short lists (0-55 bytes total)", () => {
		it("encodes empty list as 0xc0", () => {
			const encoded = Effect.runSync(Rlp.encode([]));
			expect(encoded).toEqual(new Uint8Array([0xc0]));
		});

		it("encodes list with single byte item", () => {
			const encoded = Effect.runSync(Rlp.encode([new Uint8Array([0x01])]));
			expect(encoded).toEqual(new Uint8Array([0xc1, 0x01]));
		});

		it("encodes list with multiple items", () => {
			const encoded = Effect.runSync(
				Rlp.encode([new Uint8Array([0x01]), new Uint8Array([0x02])]),
			);
			expect(encoded).toEqual(new Uint8Array([0xc2, 0x01, 0x02]));
		});
	});

	describe("long lists (> 55 bytes)", () => {
		it("encodes list with total > 55 bytes", () => {
			const items = Array.from({ length: 60 }, () => new Uint8Array([0xab]));
			const encoded = Effect.runSync(Rlp.encode(items));
			expect(encoded[0]).toBe(0xf8);
		});
	});

	describe("nested lists", () => {
		it("encodes nested list", () => {
			const nested: Encodable = [[new Uint8Array([0x01])]];
			const encoded = Effect.runSync(Rlp.encode(nested));
			expect(encoded).toEqual(new Uint8Array([0xc2, 0xc1, 0x01]));
		});

		it("encodes deeply nested empty lists", () => {
			const nested: Encodable = [[[[]]]];
			const encoded = Effect.runSync(Rlp.encode(nested));
			expect(encoded).toEqual(new Uint8Array([0xc3, 0xc2, 0xc1, 0xc0]));
		});

		it("encodes mixed nested structure", () => {
			const mixed: Encodable = [
				new Uint8Array([0x01]),
				[new Uint8Array([0x02]), new Uint8Array([0x03])],
			];
			const encoded = Effect.runSync(Rlp.encode(mixed));
			expect(encoded).toEqual(new Uint8Array([0xc4, 0x01, 0xc2, 0x02, 0x03]));
		});
	});
});

describe("Rlp decode", () => {
	describe("single byte decoding", () => {
		it("decodes single byte < 0x80", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0x7f])));
			expect(decoded.data).toEqual({ type: "bytes", value: new Uint8Array([0x7f]) });
			expect(decoded.remainder.length).toBe(0);
		});

		it("decodes single byte 0x00", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0x00])));
			expect(decoded.data).toEqual({ type: "bytes", value: new Uint8Array([0x00]) });
		});
	});

	describe("bytes decoding", () => {
		it("decodes empty bytes", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0x80])));
			expect(decoded.data).toEqual({ type: "bytes", value: new Uint8Array(0) });
		});

		it("decodes short bytes", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0x82, 0x01, 0x02])));
			expect(decoded.data).toEqual({ type: "bytes", value: new Uint8Array([0x01, 0x02]) });
		});

		it("decodes long bytes with 1-byte length", () => {
			const data = new Uint8Array(56).fill(0xab);
			const encoded = Effect.runSync(Rlp.encode(data));
			const decoded = Effect.runSync(Rlp.decode(encoded));
			expect(decoded.data).toEqual({ type: "bytes", value: data });
		});
	});

	describe("list decoding", () => {
		it("decodes empty list", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0xc0])));
			expect(decoded.data).toEqual({ type: "list", value: [] });
		});

		it("decodes list with items", () => {
			const decoded = Effect.runSync(Rlp.decode(new Uint8Array([0xc2, 0x01, 0x02])));
			expect(decoded.data).toEqual({
				type: "list",
				value: [
					{ type: "bytes", value: new Uint8Array([0x01]) },
					{ type: "bytes", value: new Uint8Array([0x02]) },
				],
			});
		});
	});

	describe("error handling", () => {
		it("rejects oversized length prefixes", async () => {
			const oversizedLength = new Uint8Array([
				0xbf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
			]);
			await expect(Effect.runPromise(Rlp.decode(oversizedLength))).rejects.toThrow();
		});

		it("rejects truncated input", async () => {
			const truncated = new Uint8Array([0x82, 0x01]);
			await expect(Effect.runPromise(Rlp.decode(truncated))).rejects.toThrow();
		});

		it("rejects invalid length for long bytes", async () => {
			const invalid = new Uint8Array([0xb8, 0x10]);
			await expect(Effect.runPromise(Rlp.decode(invalid))).rejects.toThrow();
		});
	});
});

describe("Rlp round-trip", () => {
	it("round-trips empty bytes", () => {
		const original = new Uint8Array(0);
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("round-trips short bytes", () => {
		const original = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("round-trips long bytes", () => {
		const original = new Uint8Array(200).fill(0xab);
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("round-trips empty list", () => {
		const original: Encodable = [];
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("round-trips nested lists", () => {
		const original: Encodable = [
			new Uint8Array([0x01]),
			[new Uint8Array([0x02]), [new Uint8Array([0x03])]],
			[],
		];
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("round-trips deeply nested empty lists", () => {
		const original: Encodable = [[[[]]]];
		const encoded = Effect.runSync(Rlp.encode(original));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("handles concurrent encode/decode without shared state", async () => {
		const inputs: Encodable[] = [
			new Uint8Array([0x01, 0x02, 0x03]),
			[new Uint8Array([0x04]), [new Uint8Array([0x05])]],
			[],
			[new Uint8Array(0), new Uint8Array([0x00])],
			[[[new Uint8Array([0xaa])]]],
		];

		const encoded = await Promise.all(
			inputs.map((input) => Effect.runPromise(Rlp.encode(input))),
		);
		const decoded = await Promise.all(
			encoded.map((bytes) => Effect.runPromise(Rlp.decode(bytes))),
		);
		const reEncoded = await Promise.all(
			decoded.map(({ data }) => Effect.runPromise(Rlp.encode(data))),
		);

		encoded.forEach((bytes, index) => {
			expect(decoded[index]?.remainder.length).toBe(0);
			expect(reEncoded[index]).toEqual(bytes);
		});
	});
});

describe("Rlp edge cases", () => {
	it("distinguishes empty list from empty bytes", () => {
		const emptyBytesEncoded = Effect.runSync(Rlp.encode(new Uint8Array(0)));
		const emptyListEncoded = Effect.runSync(Rlp.encode([]));

		expect(emptyBytesEncoded).toEqual(new Uint8Array([0x80]));
		expect(emptyListEncoded).toEqual(new Uint8Array([0xc0]));

		const emptyBytesDecoded = Effect.runSync(Rlp.decode(emptyBytesEncoded));
		const emptyListDecoded = Effect.runSync(Rlp.decode(emptyListEncoded));

		expect(emptyBytesDecoded.data).toEqual({ type: "bytes", value: new Uint8Array(0) });
		expect(emptyListDecoded.data).toEqual({ type: "list", value: [] });
	});

	it("encodes all single-byte values correctly", () => {
		for (let i = 0; i < 128; i++) {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([i])));
			expect(encoded).toEqual(new Uint8Array([i]));
		}
		for (let i = 128; i < 256; i++) {
			const encoded = Effect.runSync(Rlp.encode(new Uint8Array([i])));
			expect(encoded).toEqual(new Uint8Array([0x81, i]));
		}
	});

	it("handles large nested structure", () => {
		const buildNested = (depth: number): Encodable => {
			if (depth === 0) return new Uint8Array([0x42]);
			return [buildNested(depth - 1)];
		};
		const nested = buildNested(10);
		const encoded = Effect.runSync(Rlp.encode(nested));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});

	it("handles list with many items", () => {
		const items = Array.from({ length: 100 }, (_, i) => new Uint8Array([i]));
		const encoded = Effect.runSync(Rlp.encode(items));
		const { data } = Effect.runSync(Rlp.decode(encoded));
		const reEncoded = Effect.runSync(Rlp.encode(data));
		expect(reEncoded).toEqual(encoded);
	});
});
