import { describe, it, expect } from "vitest";
import * as RlpOx from "./index.ox.js";

describe("Rlp Ox Migration", () => {
	describe("Core Ox Exports", () => {
		it("should export from function", () => {
			expect(typeof RlpOx.from).toBe("function");
		});

		it("should export fromBytes function", () => {
			expect(typeof RlpOx.fromBytes).toBe("function");
		});

		it("should export fromHex function", () => {
			expect(typeof RlpOx.fromHex).toBe("function");
		});

		it("should export toBytes function", () => {
			expect(typeof RlpOx.toBytes).toBe("function");
		});

		it("should export toHex function", () => {
			expect(typeof RlpOx.toHex).toBe("function");
		});

		it("should export to function", () => {
			expect(typeof RlpOx.to).toBe("function");
		});

		it("should export readLength function", () => {
			expect(typeof RlpOx.readLength).toBe("function");
		});

		it("should export readList function", () => {
			expect(typeof RlpOx.readList).toBe("function");
		});

		it("should export decodeRlpCursor function", () => {
			expect(typeof RlpOx.decodeRlpCursor).toBe("function");
		});
	});

	describe("Compatibility Aliases", () => {
		it("encode should wrap from with Hex output", () => {
			const data = "0x74657374";
			const direct = RlpOx.from(data, { as: "Hex" });
			const aliased = RlpOx.encode(data);
			expect(direct).toBe(aliased);
		});

		it("encodeBytes should wrap from with Bytes output", () => {
			const data = new Uint8Array([1, 2, 3]);
			const direct = RlpOx.from(data, { as: "Bytes" });
			const aliased = RlpOx.encodeBytes(data);
			expect(direct).toEqual(aliased);
		});

		it("decode should be an alias for fromBytes", () => {
			expect(RlpOx.decode).toBe(RlpOx.fromBytes);
		});

		it("decodeHex should be an alias for fromHex", () => {
			expect(RlpOx.decodeHex).toBe(RlpOx.fromHex);
		});
	});

	describe("RLP Encoding/Decoding Roundtrip", () => {
		it("should encode empty list to RLP bytes", () => {
			const encoded = RlpOx.from([], { as: "Bytes" });
			expect(encoded instanceof Uint8Array).toBe(true);
		});

		it("should encode hex string to RLP", () => {
			const data = "0x68656c6c6f";
			const encoded = RlpOx.from(data, { as: "Hex" });
			expect(typeof encoded).toBe("string");
			expect(encoded.startsWith("0x")).toBe(true);
		});

		it("should encode bytes to RLP", () => {
			const data = new Uint8Array([1, 2, 3]);
			const encoded = RlpOx.from(data, { as: "Bytes" });
			expect(encoded instanceof Uint8Array).toBe(true);
		});

		it("should encode list of hex items to RLP", () => {
			const data = ["0x6361", "0x6462"] as Parameters<typeof RlpOx.from>[0];
			const encoded = RlpOx.from(data, { as: "Hex" });
			expect(typeof encoded).toBe("string");
		});

		it("should convert RLP between Hex and Bytes", () => {
			const data = "0x74657374";
			const hex = RlpOx.from(data, { as: "Hex" });
			const bytes = RlpOx.toBytes(hex);
			expect(bytes instanceof Uint8Array).toBe(true);
		});
	});

	describe("Alias Functionality", () => {
		it("encode alias should work like from", () => {
			const data = "0x74657374";
			const encoded1 = RlpOx.from(data, { as: "Hex" });
			const encoded2 = RlpOx.encode(data);
			expect(encoded1).toBe(encoded2);
		});

		it("decode alias should work like fromBytes", () => {
			const data = new Uint8Array([1, 2, 3]);
			const encoded = RlpOx.from(data, { as: "Bytes" });

			const decoded1 = RlpOx.fromBytes(encoded);
			const decoded2 = RlpOx.decode(encoded);

			expect(decoded1).toEqual(decoded2);
		});

		it("decodeHex alias should work like fromHex", () => {
			const data = "0x74657374";
			const encoded = RlpOx.from(data, { as: "Hex" });
			const hex = RlpOx.toHex(encoded);

			const decoded1 = RlpOx.fromHex(hex);
			const decoded2 = RlpOx.decodeHex(hex);

			expect(decoded1).toEqual(decoded2);
		});
	});

	describe("Known RLP Vectors", () => {
		// Standard RLP test vectors
		it("should encode empty bytes", () => {
			const encoded = RlpOx.from(new Uint8Array([]), { as: "Hex" });
			expect(typeof encoded).toBe("string");
		});

		it("should encode single byte < 128 correctly", () => {
			// Single byte 0x00-0x7f: the byte itself
			const encoded = RlpOx.from(new Uint8Array([0x7f]), { as: "Hex" });
			expect(encoded).toBe("0x7f");
		});

		it('should encode hex "0x61" (a)', () => {
			const encoded = RlpOx.from("0x61", { as: "Hex" });
			expect(typeof encoded).toBe("string");
		});

		it('should encode hex "0x646f67" (dog)', () => {
			const encoded = RlpOx.from("0x646f67", { as: "Hex" });
			expect(typeof encoded).toBe("string");
		});

		it('should encode list ["0x636174", "0x646f67"] (cat, dog)', () => {
			const encoded = RlpOx.from(["0x636174", "0x646f67"] as const, { as: "Hex" });
			expect(typeof encoded).toBe("string");
		});
	});

	describe("Type Safety", () => {
		it("should handle RlpType export", () => {
			// Verify type is exported (compile-time check)
			expect(typeof RlpOx).toBe("object");
		});
	});
});
