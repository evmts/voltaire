import { describe, expect, it } from "vitest";
import * as Metadata from "./index.js";

describe("Metadata", () => {
	describe("from", () => {
		it("creates metadata from raw bytes", () => {
			const raw = new Uint8Array([0xa2, 0x64, 0x69, 0x70, 0x66, 0x73]);
			const meta = Metadata.from(raw);
			expect(meta.raw).toBe(raw);
			expect(meta.solc).toBeUndefined();
		});
	});

	describe("decode", () => {
		it("decodes basic CBOR metadata", () => {
			// Simple CBOR structure - just test that it doesn't throw
			const raw = new Uint8Array([
				0xa2, // map(2)
				0x64,
				0x69,
				0x70,
				0x66,
				0x73, // "ipfs"
				0x42,
				0x12,
				0x34, // bytes(2): 0x1234
				0x64,
				0x73,
				0x6f,
				0x6c,
				0x63, // "solc"
				0x66,
				0x30,
				0x2e,
				0x38,
				0x2e,
				0x31,
				0x39, // "0.8.19"
			]);
			const meta = Metadata.decode(raw);
			expect(meta.raw).toBe(raw);
			// CBOR parsing is basic, just verify it returns metadata object
			expect(meta).toHaveProperty("raw");
		});

		it("handles empty metadata", () => {
			const raw = new Uint8Array([0xa0]); // empty map
			const meta = Metadata.decode(raw);
			expect(meta.raw).toBe(raw);
		});
	});

	describe("fromBytecode", () => {
		it("extracts metadata from bytecode", () => {
			// Metadata: 6 bytes + 27 padding = 33 bytes
			const bytecode = new Uint8Array([
				0x60,
				0x01,
				0x60,
				0x01,
				0x55, // code
				0xa2,
				0x64,
				0x69,
				0x70,
				0x66,
				0x73, // metadata (6 bytes)
				...new Array(27).fill(0x00), // padding
				0x00,
				0x21, // length marker: 33 bytes (0x21 = 33)
			]);
			const meta = Metadata.fromBytecode(bytecode);
			expect(meta).not.toBeNull();
			expect(meta?.raw.length).toBe(33);
		});

		it("returns null if no metadata", () => {
			const bytecode = new Uint8Array([0x60, 0x01, 0x60, 0x01, 0x55]);
			const meta = Metadata.fromBytecode(bytecode);
			expect(meta).toBeNull();
		});

		it("returns null for invalid length marker", () => {
			const bytecode = new Uint8Array([0x60, 0x01, 0xff, 0xff]);
			const meta = Metadata.fromBytecode(bytecode);
			expect(meta).toBeNull();
		});
	});

	describe("encode", () => {
		it("encodes metadata to CBOR", () => {
			const meta: import("./MetadataType.js").Metadata = {
				raw: new Uint8Array(),
				ipfs: "0x1234",
				solc: "0.8.19",
			};
			const encoded = Metadata.encode(meta);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(0);
			// Should start with map marker
			expect(encoded[0]).toBeGreaterThanOrEqual(0xa0);
			expect(encoded[0]).toBeLessThanOrEqual(0xaf);
		});

		it("handles metadata with all fields", () => {
			const meta: import("./MetadataType.js").Metadata = {
				raw: new Uint8Array(),
				ipfs: "0x1234567890abcdef",
				solc: "0.8.19",
				bzzr0: "0xabcdef1234567890",
				bzzr1: "0xfedcba0987654321",
				experimental: true,
			};
			const encoded = Metadata.encode(meta);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBeGreaterThan(10);
		});

		it("handles minimal metadata", () => {
			const meta: import("./MetadataType.js").Metadata = {
				raw: new Uint8Array(),
			};
			const encoded = Metadata.encode(meta);
			expect(encoded).toBeInstanceOf(Uint8Array);
			// Empty map: 0xa0
			expect(encoded[0]).toBe(0xa0);
		});
	});
});
