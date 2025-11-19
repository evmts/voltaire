import { describe, expect, it } from "vitest";
import { from, readWord, slice } from "./index.js";

describe("MemoryDump", () => {
	describe("from", () => {
		it("creates from Uint8Array", () => {
			const data = new Uint8Array(64);
			const dump = from(data);

			expect(dump.data).toBe(data);
			expect(dump.length).toBe(64);
		});

		it("creates from object", () => {
			const data = new Uint8Array(128);
			const dump = from({ data, length: 128 });

			expect(dump.data).toBe(data);
			expect(dump.length).toBe(128);
		});

		it("infers length from data if not provided", () => {
			const data = new Uint8Array(96);
			const dump = from({ data });

			expect(dump.length).toBe(96);
		});

		it("throws on invalid input", () => {
			expect(() => from(null as any)).toThrow("Invalid MemoryDump input");
			expect(() => from(123 as any)).toThrow("Invalid MemoryDump input");
		});
	});

	describe("readWord", () => {
		it("reads 32-byte word at offset 0", () => {
			const data = new Uint8Array(64);
			for (let i = 0; i < 32; i++) {
				data[i] = i;
			}
			const dump = from(data);

			const word = readWord(dump, 0);

			expect(word).toHaveLength(32);
			for (let i = 0; i < 32; i++) {
				expect(word[i]).toBe(i);
			}
		});

		it("reads 32-byte word at offset 32", () => {
			const data = new Uint8Array(64);
			for (let i = 0; i < 64; i++) {
				data[i] = i;
			}
			const dump = from(data);

			const word = readWord(dump, 32);

			expect(word).toHaveLength(32);
			for (let i = 0; i < 32; i++) {
				expect(word[i]).toBe(32 + i);
			}
		});

		it("throws on out of bounds offset", () => {
			const dump = from(new Uint8Array(64));

			expect(() => readWord(dump, -1)).toThrow("out of bounds");
			expect(() => readWord(dump, 64)).toThrow("out of bounds");
			expect(() => readWord(dump, 100)).toThrow("out of bounds");
		});

		it("throws on insufficient data for 32-byte word", () => {
			const dump = from(new Uint8Array(40));

			expect(() => readWord(dump, 16)).toThrow("Insufficient data");
		});

		it("works with Uint8Array directly", () => {
			const data = new Uint8Array(64);
			data[0] = 0xff;

			const word = readWord(data, 0);

			expect(word[0]).toBe(0xff);
		});
	});

	describe("slice", () => {
		it("slices from start to end", () => {
			const data = new Uint8Array(128);
			for (let i = 0; i < 128; i++) {
				data[i] = i;
			}
			const dump = from(data);

			const result = slice(dump, 32, 64);

			expect(result).toHaveLength(32);
			for (let i = 0; i < 32; i++) {
				expect(result[i]).toBe(32 + i);
			}
		});

		it("slices from start to end of memory", () => {
			const data = new Uint8Array(96);
			for (let i = 0; i < 96; i++) {
				data[i] = i;
			}
			const dump = from(data);

			const result = slice(dump, 64);

			expect(result).toHaveLength(32);
			for (let i = 0; i < 32; i++) {
				expect(result[i]).toBe(64 + i);
			}
		});

		it("throws on invalid start offset", () => {
			const dump = from(new Uint8Array(64));

			expect(() => slice(dump, -1)).toThrow("out of bounds");
			expect(() => slice(dump, 128)).toThrow("out of bounds");
		});

		it("throws on invalid end offset", () => {
			const dump = from(new Uint8Array(64));

			expect(() => slice(dump, 32, 16)).toThrow("invalid");
			expect(() => slice(dump, 0, 128)).toThrow("invalid");
		});

		it("works with Uint8Array directly", () => {
			const data = new Uint8Array(64);
			data[10] = 0xaa;

			const result = slice(data, 0, 32);

			expect(result[10]).toBe(0xaa);
		});
	});
});
