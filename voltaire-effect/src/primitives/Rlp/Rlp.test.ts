import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import * as Rlp from "./index.js";

type Encodable = Uint8Array | Encodable[];

describe("Rlp edge cases", () => {
	it("encodes deeply nested empty lists", () => {
		const nested: Encodable = [[[[]]]];
		const encoded = Effect.runSync(Rlp.encode(nested));
		expect(encoded).toEqual(new Uint8Array([0xc3, 0xc2, 0xc1, 0xc0]));

		const decoded = Effect.runSync(Rlp.decode(encoded));
		expect(decoded.remainder.length).toBe(0);
		expect(decoded.data).toEqual({
			type: "list",
			value: [
				{
					type: "list",
					value: [
						{
							type: "list",
							value: [{ type: "list", value: [] }],
						},
					],
				},
			],
		});
	});

	it("distinguishes empty list from empty bytes", () => {
		const emptyBytesEncoded = Effect.runSync(
			Rlp.encode(new Uint8Array(0)),
		);
		const emptyListEncoded = Effect.runSync(Rlp.encode([]));

		expect(emptyBytesEncoded).toEqual(new Uint8Array([0x80]));
		expect(emptyListEncoded).toEqual(new Uint8Array([0xc0]));

		const emptyBytesDecoded = Effect.runSync(Rlp.decode(emptyBytesEncoded));
		const emptyListDecoded = Effect.runSync(Rlp.decode(emptyListEncoded));

		expect(emptyBytesDecoded.data).toEqual({
			type: "bytes",
			value: new Uint8Array(0),
		});
		expect(emptyListDecoded.data).toEqual({ type: "list", value: [] });
	});

it("rejects oversized length prefixes to avoid integer overflow", async () => {
		const oversizedLength = new Uint8Array([
			0xbf,
			0xff,
			0xff,
			0xff,
			0xff,
			0xff,
			0xff,
			0xff,
			0xff,
		]);
	await expect(Effect.runPromise(Rlp.decode(oversizedLength))).rejects.toThrow();
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
