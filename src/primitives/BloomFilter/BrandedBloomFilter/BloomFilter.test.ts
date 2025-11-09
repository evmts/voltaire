import { describe, expect, it } from "vitest";
import { BITS, DEFAULT_HASH_COUNT, SIZE } from "./constants.js";
import * as BloomFilter from "./index.js";

describe("BloomFilter - Basic Operations", () => {
	describe("create", () => {
		it("creates filter with default parameters", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(filter.length).toBe(SIZE);
			expect(filter.m).toBe(BITS);
			expect(filter.k).toBe(DEFAULT_HASH_COUNT);
		});

		it("creates filter with custom parameters", () => {
			const filter = BloomFilter.create(4096, 5);
			expect(filter.length).toBe(512);
			expect(filter.m).toBe(4096);
			expect(filter.k).toBe(5);
		});

		it("creates empty filter (all zeros)", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			for (let i = 0; i < filter.length; i++) {
				expect(filter[i]).toBe(0);
			}
		});

		it("throws for zero m parameter", () => {
			expect(() => BloomFilter.create(0, 3)).toThrow(
				"Bloom filter parameters must be positive",
			);
		});

		it("throws for negative m parameter", () => {
			expect(() => BloomFilter.create(-1, 3)).toThrow(
				"Bloom filter parameters must be positive",
			);
		});

		it("throws for zero k parameter", () => {
			expect(() => BloomFilter.create(2048, 0)).toThrow(
				"Bloom filter parameters must be positive",
			);
		});

		it("throws for negative k parameter", () => {
			expect(() => BloomFilter.create(2048, -1)).toThrow(
				"Bloom filter parameters must be positive",
			);
		});
	});

	describe("add", () => {
		it("adds item to filter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			BloomFilter.add(filter, item);
			expect(BloomFilter.contains(filter, item)).toBe(true);
		});

		it("sets multiple bits for single item", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			const beforeBits = countSetBits(filter);
			BloomFilter.add(filter, item);
			const afterBits = countSetBits(filter);
			expect(afterBits).toBeGreaterThan(beforeBits);
			expect(afterBits).toBeLessThanOrEqual(beforeBits + DEFAULT_HASH_COUNT);
		});

		it("adds multiple items", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item1 = new TextEncoder().encode("test1");
			const item2 = new TextEncoder().encode("test2");
			const item3 = new TextEncoder().encode("test3");

			BloomFilter.add(filter, item1);
			BloomFilter.add(filter, item2);
			BloomFilter.add(filter, item3);

			expect(BloomFilter.contains(filter, item1)).toBe(true);
			expect(BloomFilter.contains(filter, item2)).toBe(true);
			expect(BloomFilter.contains(filter, item3)).toBe(true);
		});

		it("is idempotent (adding same item twice)", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");

			BloomFilter.add(filter, item);
			const bits1 = new Uint8Array(filter);

			BloomFilter.add(filter, item);
			const bits2 = new Uint8Array(filter);

			expect(bits2).toEqual(bits1);
		});

		it("handles empty item", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const empty = new Uint8Array(0);
			BloomFilter.add(filter, empty);
			expect(BloomFilter.contains(filter, empty)).toBe(true);
		});
	});

	describe("contains", () => {
		it("returns false for item not in filter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			expect(BloomFilter.contains(filter, item)).toBe(false);
		});

		it("returns true for item in filter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			BloomFilter.add(filter, item);
			expect(BloomFilter.contains(filter, item)).toBe(true);
		});

		it("returns false for similar but different items", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item1 = new TextEncoder().encode("test");
			const item2 = new TextEncoder().encode("test2");

			BloomFilter.add(filter, item1);
			expect(BloomFilter.contains(filter, item2)).toBe(false);
		});

		it("has no false negatives", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const items = [
				"foo",
				"bar",
				"baz",
				"qux",
				"hello",
				"world",
				"test",
				"ethereum",
			];

			for (const str of items) {
				const item = new TextEncoder().encode(str);
				BloomFilter.add(filter, item);
			}

			for (const str of items) {
				const item = new TextEncoder().encode(str);
				expect(BloomFilter.contains(filter, item)).toBe(true);
			}
		});
	});

	describe("isEmpty", () => {
		it("returns true for new filter", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(BloomFilter.isEmpty(filter)).toBe(true);
		});

		it("returns false after adding item", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			BloomFilter.add(filter, item);
			expect(BloomFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false if any bit is set", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			filter[0] = 1;
			expect(BloomFilter.isEmpty(filter)).toBe(false);
		});
	});

	describe("merge", () => {
		it("merges two filters", () => {
			const f1 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const f2 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const item1 = new TextEncoder().encode("test1");
			const item2 = new TextEncoder().encode("test2");

			BloomFilter.add(f1, item1);
			BloomFilter.add(f2, item2);

			const merged = BloomFilter.merge(f1, f2);

			expect(BloomFilter.contains(merged, item1)).toBe(true);
			expect(BloomFilter.contains(merged, item2)).toBe(true);
		});

		it("does not mutate source filters", () => {
			const f1 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const f2 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

			const item1 = new TextEncoder().encode("test1");
			const item2 = new TextEncoder().encode("test2");

			BloomFilter.add(f1, item1);
			BloomFilter.add(f2, item2);

			BloomFilter.merge(f1, f2);

			expect(BloomFilter.contains(f1, item1)).toBe(true);
			expect(BloomFilter.contains(f1, item2)).toBe(false);
			expect(BloomFilter.contains(f2, item1)).toBe(false);
			expect(BloomFilter.contains(f2, item2)).toBe(true);
		});

		it("throws for mismatched m", () => {
			const f1 = BloomFilter.create(2048, 3);
			const f2 = BloomFilter.create(4096, 3);

			expect(() => BloomFilter.merge(f1, f2)).toThrow(
				"Cannot merge filters with different parameters",
			);
		});

		it("throws for mismatched k", () => {
			const f1 = BloomFilter.create(2048, 3);
			const f2 = BloomFilter.create(2048, 5);

			expect(() => BloomFilter.merge(f1, f2)).toThrow(
				"Cannot merge filters with different parameters",
			);
		});
	});
});

describe("BloomFilter - Ethereum Specific", () => {
	describe("Ethereum bloom filter standard", () => {
		it("uses 256 bytes (2048 bits)", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(filter.length).toBe(256);
		});

		it("uses 3 hash functions", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			expect(filter.k).toBe(3);
		});

		it("sets exactly 3 bits per item (when no collisions)", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("ethereum");

			const beforeBits = countSetBits(filter);
			BloomFilter.add(filter, item);
			const afterBits = countSetBits(filter);

			expect(afterBits - beforeBits).toBeLessThanOrEqual(3);
			expect(afterBits - beforeBits).toBeGreaterThan(0);
		});
	});

	describe("Address filtering", () => {
		it("adds and checks 20-byte address", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const address = new Uint8Array(20);
			for (let i = 0; i < 20; i++) {
				address[i] = i + 1;
			}

			BloomFilter.add(filter, address);
			expect(BloomFilter.contains(filter, address)).toBe(true);
		});

		it("distinguishes different addresses", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const addr1 = new Uint8Array(20);
			const addr2 = new Uint8Array(20);
			addr2[19] = 1;

			BloomFilter.add(filter, addr1);
			expect(BloomFilter.contains(filter, addr1)).toBe(true);
			expect(BloomFilter.contains(filter, addr2)).toBe(false);
		});
	});

	describe("Topic filtering (32-byte hashes)", () => {
		it("adds and checks 32-byte topic", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const topic = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				topic[i] = i;
			}

			BloomFilter.add(filter, topic);
			expect(BloomFilter.contains(filter, topic)).toBe(true);
		});

		it("handles multiple topics", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const topic1 = new Uint8Array(32).fill(1);
			const topic2 = new Uint8Array(32).fill(2);
			const topic3 = new Uint8Array(32).fill(3);

			BloomFilter.add(filter, topic1);
			BloomFilter.add(filter, topic2);
			BloomFilter.add(filter, topic3);

			expect(BloomFilter.contains(filter, topic1)).toBe(true);
			expect(BloomFilter.contains(filter, topic2)).toBe(true);
			expect(BloomFilter.contains(filter, topic3)).toBe(true);
		});
	});

	describe("Log filtering use case", () => {
		it("filters logs by address", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const targetAddr = new Uint8Array(20).fill(1);
			const otherAddr = new Uint8Array(20).fill(2);

			BloomFilter.add(bloom, targetAddr);

			expect(BloomFilter.contains(bloom, targetAddr)).toBe(true);
			expect(BloomFilter.contains(bloom, otherAddr)).toBe(false);
		});

		it("combines address and topic filtering", () => {
			const bloom = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const address = new Uint8Array(20).fill(1);
			const topic = new Uint8Array(32).fill(10);

			BloomFilter.add(bloom, address);
			BloomFilter.add(bloom, topic);

			expect(BloomFilter.contains(bloom, address)).toBe(true);
			expect(BloomFilter.contains(bloom, topic)).toBe(true);
		});
	});
});

describe("BloomFilter - False Positive Testing", () => {
	it("measures false positive rate for small dataset", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const numItems = 50;
		const numTests = 1000;

		for (let i = 0; i < numItems; i++) {
			const item = new TextEncoder().encode(`item${i}`);
			BloomFilter.add(filter, item);
		}

		let falsePositives = 0;
		for (let i = numItems; i < numItems + numTests; i++) {
			const item = new TextEncoder().encode(`item${i}`);
			if (BloomFilter.contains(filter, item)) {
				falsePositives++;
			}
		}

		const fpr = falsePositives / numTests;
		expect(fpr).toBeLessThan(0.05);
	});

	it("measures false positive rate for larger dataset", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const numItems = 200;
		const numTests = 1000;

		for (let i = 0; i < numItems; i++) {
			const item = new TextEncoder().encode(`item${i}`);
			BloomFilter.add(filter, item);
		}

		let falsePositives = 0;
		for (let i = numItems; i < numItems + numTests; i++) {
			const item = new TextEncoder().encode(`item${i}`);
			if (BloomFilter.contains(filter, item)) {
				falsePositives++;
			}
		}

		const fpr = falsePositives / numTests;
		expect(fpr).toBeLessThan(0.15);
	});

	it("false positive rate increases with density", () => {
		const f1 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const f2 = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);

		for (let i = 0; i < 50; i++) {
			BloomFilter.add(f1, new TextEncoder().encode(`item${i}`));
		}

		for (let i = 0; i < 200; i++) {
			BloomFilter.add(f2, new TextEncoder().encode(`item${i}`));
		}

		const d1 = BloomFilter.density(f1);
		const d2 = BloomFilter.density(f2);

		expect(d2).toBeGreaterThan(d1);

		const fpr1 = BloomFilter.expectedFalsePositiveRate(f1, 50);
		const fpr2 = BloomFilter.expectedFalsePositiveRate(f2, 200);

		expect(fpr2).toBeGreaterThan(fpr1);
	});
});

describe("BloomFilter - Edge Cases", () => {
	it("handles single bit set", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		filter[0] = 1;
		expect(BloomFilter.isEmpty(filter)).toBe(false);
		expect(BloomFilter.density(filter)).toBeGreaterThan(0);
	});

	it("handles all bits set", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		for (let i = 0; i < filter.length; i++) {
			filter[i] = 0xff;
		}
		expect(BloomFilter.density(filter)).toBe(1);

		const testItem = new TextEncoder().encode("test");
		expect(BloomFilter.contains(filter, testItem)).toBe(true);
	});

	it("handles very long items", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const longItem = new Uint8Array(10000).fill(42);

		BloomFilter.add(filter, longItem);
		expect(BloomFilter.contains(filter, longItem)).toBe(true);
	});

	it("handles items with all zero bytes", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const zeros = new Uint8Array(32);

		BloomFilter.add(filter, zeros);
		expect(BloomFilter.contains(filter, zeros)).toBe(true);
	});

	it("handles items with all 0xFF bytes", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const ones = new Uint8Array(32).fill(0xff);

		BloomFilter.add(filter, ones);
		expect(BloomFilter.contains(filter, ones)).toBe(true);
	});

	it("distinguishes single byte difference", () => {
		const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
		const item1 = new Uint8Array(32);
		const item2 = new Uint8Array(32);
		item2[0] = 1;

		BloomFilter.add(filter, item1);
		expect(BloomFilter.contains(filter, item2)).toBe(false);
	});
});

describe("BloomFilter - Serialization", () => {
	describe("toHex", () => {
		it("converts empty filter to hex", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const hex = BloomFilter.toHex(filter);
			expect(hex).toMatch(/^0x[0-9a-f]{512}$/);
			expect(hex).toBe(`0x${"00".repeat(256)}`);
		});

		it("converts filter with items to hex", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			BloomFilter.add(filter, item);

			const hex = BloomFilter.toHex(filter);
			expect(hex).toMatch(/^0x[0-9a-f]{512}$/);
			expect(hex).not.toBe(`0x${"00".repeat(256)}`);
		});

		it("produces lowercase hex", () => {
			const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			filter[0] = 0xff;
			const hex = BloomFilter.toHex(filter);
			expect(hex).toMatch(/^0x[0-9a-f]+$/);
		});
	});

	describe("fromHex", () => {
		it("creates filter from hex string", () => {
			const hex = `0x${"00".repeat(256)}`;
			const filter = BloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);
			expect(filter.length).toBe(256);
			expect(filter.m).toBe(BITS);
			expect(filter.k).toBe(DEFAULT_HASH_COUNT);
		});

		it("recreates filter with data", () => {
			const original = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			const item = new TextEncoder().encode("test");
			BloomFilter.add(original, item);

			const hex = BloomFilter.toHex(original);
			const restored = BloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);

			expect(BloomFilter.contains(restored, item)).toBe(true);
		});

		it("round-trips through hex", () => {
			const original = BloomFilter.create(BITS, DEFAULT_HASH_COUNT);
			BloomFilter.add(original, new TextEncoder().encode("test1"));
			BloomFilter.add(original, new TextEncoder().encode("test2"));
			BloomFilter.add(original, new TextEncoder().encode("test3"));

			const hex = BloomFilter.toHex(original);
			const restored = BloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);

			expect(BloomFilter.toHex(restored)).toBe(hex);
		});

		it("handles uppercase hex", () => {
			const hex = `0x${"FF".repeat(256)}`;
			const filter = BloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);
			for (let i = 0; i < filter.length; i++) {
				expect(filter[i]).toBe(0xff);
			}
		});

		it("handles hex without 0x prefix", () => {
			const hex = "00".repeat(256);
			const filter = BloomFilter.fromHex(hex, BITS, DEFAULT_HASH_COUNT);
			expect(filter.length).toBe(256);
		});
	});
});

function countSetBits(filter: Uint8Array): number {
	let count = 0;
	for (let i = 0; i < filter.length; i++) {
		const byte = filter[i];
		if (byte !== undefined) {
			let b = byte;
			while (b > 0) {
				count += b & 1;
				b >>= 1;
			}
		}
	}
	return count;
}
