/**
 * Tests for docs/primitives/rlp/index.mdx
 *
 * Validates that all code examples in the RLP documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("RLP Documentation - index.mdx", () => {
	describe("Type Definition", () => {
		it("should return bytes type for encoded bytes", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const data = new Uint8Array([1, 2, 3]);
			const encoded = Rlp.encode(data);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("bytes");
			expect(decoded.data.value).toBeInstanceOf(Uint8Array);
		});

		it("should return list type for encoded list", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const list = [new Uint8Array([1]), new Uint8Array([2])];
			const encoded = Rlp.encodeList(list);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("list");
		});
	});

	describe("Encoding", () => {
		it("should encode bytes", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const data = new Uint8Array([0x01, 0x02, 0x03]);
			const encoded = Rlp.encode(data);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("should encode list", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const list = [
				new Uint8Array([0x01]),
				new Uint8Array([0x02]),
				new Uint8Array([0x03]),
			];

			const encoded = Rlp.encodeList(list);

			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(0);
		});

		it("should encode empty list", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encodeList([]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			// Empty list is encoded as 0xc0
			expect(encoded[0]).toBe(0xc0);
		});

		it("should encode empty bytes", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encode(new Uint8Array([]));

			expect(encoded).toBeInstanceOf(Uint8Array);
			// Empty bytes is encoded as 0x80
			expect(encoded[0]).toBe(0x80);
		});

		it("should encode single byte < 0x80", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encode(new Uint8Array([0x42]));

			// Single byte < 0x80 is encoded as itself
			expect(encoded.length).toBe(1);
			expect(encoded[0]).toBe(0x42);
		});
	});

	describe("Decoding", () => {
		it("should decode bytes", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const original = new Uint8Array([0x01, 0x02, 0x03]);
			const encoded = Rlp.encode(original);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("bytes");
			expect(decoded.data.value).toEqual(original);
		});

		it("should decode list", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const list = [new Uint8Array([0x01]), new Uint8Array([0x02])];
			const encoded = Rlp.encodeList(list);
			const decoded = Rlp.decode(encoded);

			expect(decoded.data.type).toBe("list");
			expect(Array.isArray(decoded.data.value)).toBe(true);
			expect(decoded.data.value.length).toBe(2);
		});

		it("should return remainder for stream decoding", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const data = new Uint8Array([0x01, 0x02, 0x03]);
			const encoded = Rlp.encode(data);

			// Append extra bytes
			const withExtra = new Uint8Array([...encoded, 0xff, 0xfe]);
			// Use stream mode to allow extra bytes
			const decoded = Rlp.decode(withExtra, { stream: true });

			expect(decoded.remainder.length).toBe(2);
			expect(decoded.remainder[0]).toBe(0xff);
			expect(decoded.remainder[1]).toBe(0xfe);
		});
	});

	describe("Nested Structures", () => {
		it("should encode and decode nested lists", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			// Nested list: [[0x01], [0x02, 0x03]]
			const inner1 = Rlp.encodeList([new Uint8Array([0x01])]);
			const inner2 = Rlp.encodeList([
				new Uint8Array([0x02]),
				new Uint8Array([0x03]),
			]);
			const outer = Rlp.encodeList([inner1, inner2]);

			const decoded = Rlp.decode(outer);
			expect(decoded.data.type).toBe("list");
		});
	});

	describe("RLP Encoding Rules", () => {
		it("single byte 0x00 encodes as itself", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encode(new Uint8Array([0x00]));
			expect(encoded[0]).toBe(0x00);
		});

		it("single byte 0x7f encodes as itself", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encode(new Uint8Array([0x7f]));
			expect(encoded[0]).toBe(0x7f);
		});

		it("single byte 0x80 encodes with length prefix", async () => {
			const { Rlp } = await import("../../../src/primitives/Rlp/index.js");

			const encoded = Rlp.encode(new Uint8Array([0x80]));
			// 0x81 prefix (0x80 + 1 byte length) + 0x80 value
			expect(encoded.length).toBe(2);
			expect(encoded[0]).toBe(0x81);
			expect(encoded[1]).toBe(0x80);
		});
	});
});
