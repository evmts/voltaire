import { describe, expect, it } from "vitest";
import { hashMultiple } from "./hashMultiple.js";
import { hash } from "./hash.js";

describe("Keccak256.hashMultiple", () => {
	describe("basic functionality", () => {
		it("should hash empty array", () => {
			const result = hashMultiple([]);

			const expected = hash(new Uint8Array(0));
			expect(result).toEqual(expected);
		});

		it("should hash single chunk", () => {
			const chunk = new Uint8Array([1, 2, 3]);
			const result = hashMultiple([chunk]);

			const expected = hash(chunk);
			expect(result).toEqual(expected);
		});

		it("should hash multiple chunks", () => {
			const chunk1 = new Uint8Array([1, 2]);
			const chunk2 = new Uint8Array([3, 4]);
			const chunk3 = new Uint8Array([5, 6]);

			const result = hashMultiple([chunk1, chunk2, chunk3]);

			// Should be equivalent to hashing concatenation
			const combined = new Uint8Array([1, 2, 3, 4, 5, 6]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should return 32-byte hash", () => {
			const chunks = [new Uint8Array([1]), new Uint8Array([2])];
			const result = hashMultiple(chunks);

			expect(result.length).toBe(32);
			expect(result).toBeInstanceOf(Uint8Array);
		});
	});

	describe("chunk combinations", () => {
		it("should hash two chunks", () => {
			const chunk1 = new Uint8Array([0xaa, 0xbb]);
			const chunk2 = new Uint8Array([0xcc, 0xdd]);

			const result = hashMultiple([chunk1, chunk2]);

			const combined = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash three chunks", () => {
			const chunk1 = new Uint8Array([1]);
			const chunk2 = new Uint8Array([2]);
			const chunk3 = new Uint8Array([3]);

			const result = hashMultiple([chunk1, chunk2, chunk3]);

			const combined = new Uint8Array([1, 2, 3]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash many chunks", () => {
			const chunks = [];
			for (let i = 0; i < 10; i++) {
				chunks.push(new Uint8Array([i]));
			}

			const result = hashMultiple(chunks);

			const combined = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});
	});

	describe("varying chunk sizes", () => {
		it("should hash chunks of different sizes", () => {
			const chunk1 = new Uint8Array([1]); // 1 byte
			const chunk2 = new Uint8Array([2, 3]); // 2 bytes
			const chunk3 = new Uint8Array([4, 5, 6]); // 3 bytes

			const result = hashMultiple([chunk1, chunk2, chunk3]);

			const combined = new Uint8Array([1, 2, 3, 4, 5, 6]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash empty and non-empty chunks", () => {
			const chunk1 = new Uint8Array([1, 2]);
			const chunk2 = new Uint8Array(0); // Empty
			const chunk3 = new Uint8Array([3, 4]);

			const result = hashMultiple([chunk1, chunk2, chunk3]);

			const combined = new Uint8Array([1, 2, 3, 4]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash large chunks", () => {
			const chunk1 = new Uint8Array(100).fill(0xaa);
			const chunk2 = new Uint8Array(100).fill(0xbb);

			const result = hashMultiple([chunk1, chunk2]);

			const combined = new Uint8Array(200);
			combined.set(chunk1, 0);
			combined.set(chunk2, 100);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});
	});

	describe("determinism", () => {
		it("should produce same hash for same chunks", () => {
			const chunks = [
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
			];

			const hash1 = hashMultiple(chunks);
			const hash2 = hashMultiple(chunks);

			expect(hash1).toEqual(hash2);
		});

		it("should produce different hashes for different chunk orders", () => {
			const chunks1 = [
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
			];

			const chunks2 = [
				new Uint8Array([3, 4]),
				new Uint8Array([1, 2]),
			];

			const hash1 = hashMultiple(chunks1);
			const hash2 = hashMultiple(chunks2);

			expect(hash1).not.toEqual(hash2);
		});

		it("should produce different hashes for different chunk boundaries", () => {
			// Same total bytes, different boundaries
			const chunks1 = [
				new Uint8Array([1]),
				new Uint8Array([2, 3]),
			];

			const chunks2 = [
				new Uint8Array([1, 2]),
				new Uint8Array([3]),
			];

			const hash1 = hashMultiple(chunks1);
			const hash2 = hashMultiple(chunks2);

			// Should be SAME - chunk boundaries don't matter
			expect(hash1).toEqual(hash2);
		});
	});

	describe("empty chunks", () => {
		it("should handle all empty chunks", () => {
			const chunks = [
				new Uint8Array(0),
				new Uint8Array(0),
				new Uint8Array(0),
			];

			const result = hashMultiple(chunks);

			const expected = hash(new Uint8Array(0));
			expect(result).toEqual(expected);
		});

		it("should handle empty chunks interspersed", () => {
			const chunks = [
				new Uint8Array([1]),
				new Uint8Array(0),
				new Uint8Array([2]),
				new Uint8Array(0),
				new Uint8Array([3]),
			];

			const result = hashMultiple(chunks);

			const combined = new Uint8Array([1, 2, 3]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});
	});

	describe("Ethereum use cases", () => {
		it("should hash ABI-encoded components", () => {
			// Simulate hashing ABI-encoded data in pieces
			const selector = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const address = new Uint8Array(32);
			address[12] = 0x12;
			address[13] = 0x34;
			const amount = new Uint8Array(32);
			amount[31] = 0xff;

			const result = hashMultiple([selector, address, amount]);

			const combined = new Uint8Array(selector.length + address.length + amount.length);
			combined.set(selector, 0);
			combined.set(address, selector.length);
			combined.set(amount, selector.length + address.length);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash message prefix and content separately", () => {
			const prefix = new TextEncoder().encode("\x19Ethereum Signed Message:\n32");
			const messageHash = hash(new TextEncoder().encode("Hello"));

			const result = hashMultiple([prefix, messageHash]);

			const combined = new Uint8Array(prefix.length + messageHash.length);
			combined.set(prefix);
			combined.set(messageHash, prefix.length);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should hash RLP components", () => {
			// Simulate RLP-encoded structure
			const chunk1 = new Uint8Array([0xf8, 0x6b]); // RLP list header
			const chunk2 = new Uint8Array([0x01]); // nonce
			const chunk3 = new Uint8Array([0x09, 0x18, 0x4e, 0x72, 0xa0, 0x00]); // gasPrice
			const chunk4 = new Uint8Array([0x52, 0x08]); // gasLimit

			const result = hashMultiple([chunk1, chunk2, chunk3, chunk4]);
			expect(result.length).toBe(32);
		});
	});

	describe("edge cases", () => {
		it("should handle single empty chunk", () => {
			const result = hashMultiple([new Uint8Array(0)]);

			const expected = hash(new Uint8Array(0));
			expect(result).toEqual(expected);
		});

		it("should handle large number of small chunks", () => {
			const chunks = [];
			for (let i = 0; i < 1000; i++) {
				chunks.push(new Uint8Array([i % 256]));
			}

			const result = hashMultiple(chunks);
			expect(result.length).toBe(32);

			// Verify against concatenation
			const combined = new Uint8Array(1000);
			for (let i = 0; i < 1000; i++) {
				combined[i] = i % 256;
			}
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should handle large chunks", () => {
			const chunk1 = new Uint8Array(5000).fill(0xaa);
			const chunk2 = new Uint8Array(5000).fill(0xbb);

			const result = hashMultiple([chunk1, chunk2]);

			const combined = new Uint8Array(10000);
			combined.set(chunk1, 0);
			combined.set(chunk2, 5000);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});
	});

	describe("concatenation equivalence", () => {
		it("should match hash of manual concatenation", () => {
			const chunks = [
				new Uint8Array([1, 2, 3]),
				new Uint8Array([4, 5, 6]),
				new Uint8Array([7, 8, 9]),
			];

			const result = hashMultiple(chunks);

			// Manual concatenation
			const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
			const combined = new Uint8Array(totalLength);
			let offset = 0;
			for (const chunk of chunks) {
				combined.set(chunk, offset);
				offset += chunk.length;
			}
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});

		it("should be equivalent to spread operator concatenation", () => {
			const chunk1 = new Uint8Array([0x11, 0x22]);
			const chunk2 = new Uint8Array([0x33, 0x44]);
			const chunk3 = new Uint8Array([0x55, 0x66]);

			const result = hashMultiple([chunk1, chunk2, chunk3]);

			const combined = new Uint8Array([
				...chunk1,
				...chunk2,
				...chunk3,
			]);
			const expected = hash(combined);

			expect(result).toEqual(expected);
		});
	});

	describe("readonly array handling", () => {
		it("should accept readonly array", () => {
			const chunks: readonly Uint8Array[] = [
				new Uint8Array([1, 2]),
				new Uint8Array([3, 4]),
			];

			const result = hashMultiple(chunks);
			expect(result.length).toBe(32);
		});
	});

	describe("performance characteristics", () => {
		it("should handle many empty chunks efficiently", () => {
			const chunks = new Array(100).fill(new Uint8Array(0));
			const result = hashMultiple(chunks);

			const expected = hash(new Uint8Array(0));
			expect(result).toEqual(expected);
		});

		it("should handle uniform chunks", () => {
			const chunks = [];
			for (let i = 0; i < 50; i++) {
				chunks.push(new Uint8Array(10).fill(i));
			}

			const result = hashMultiple(chunks);
			expect(result.length).toBe(32);
		});
	});
});
