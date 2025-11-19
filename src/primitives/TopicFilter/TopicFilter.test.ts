import { describe, expect, it } from "vitest";
import { Hash } from "../Hash/index.js";
import * as TopicFilter from "./index.js";

describe("TopicFilter", () => {
	const hash1 = Hash.from(
		"0x1111111111111111111111111111111111111111111111111111111111111111",
	);
	const hash2 = Hash.from(
		"0x2222222222222222222222222222222222222222222222222222222222222222",
	);
	const hash3 = Hash.from(
		"0x3333333333333333333333333333333333333333333333333333333333333333",
	);

	describe("from", () => {
		it("creates empty filter", () => {
			const filter = TopicFilter.from([]);
			expect(filter).toEqual([]);
		});

		it("creates filter with single topic", () => {
			const filter = TopicFilter.from([hash1]);
			expect(filter[0]).toBe(hash1);
		});

		it("creates filter with null wildcards", () => {
			const filter = TopicFilter.from([hash1, null, hash2]);
			expect(filter[0]).toBe(hash1);
			expect(filter[1]).toBeNull();
			expect(filter[2]).toBe(hash2);
		});

		it("creates filter with array (OR) entry", () => {
			const filter = TopicFilter.from([[hash1, hash2]]);
			expect(Array.isArray(filter[0])).toBe(true);
			expect((filter[0] as readonly Uint8Array[])[0]).toBe(hash1);
			expect((filter[0] as readonly Uint8Array[])[1]).toBe(hash2);
		});

		it("creates filter with all 4 positions", () => {
			const filter = TopicFilter.from([hash1, hash2, hash3, null]);
			expect(filter.length).toBe(4);
		});

		it("throws on non-array", () => {
			expect(() => TopicFilter.from("not array" as any)).toThrow(
				TopicFilter.InvalidTopicFilterError,
			);
		});

		it("throws on more than 4 entries", () => {
			expect(() =>
				TopicFilter.from([hash1, hash2, hash3, null, hash1] as any),
			).toThrow(TopicFilter.InvalidTopicFilterError);
		});

		it("throws on empty array entry", () => {
			expect(() => TopicFilter.from([[] as any])).toThrow(
				TopicFilter.InvalidTopicFilterError,
			);
		});

		it("throws on invalid hash in array", () => {
			expect(() => TopicFilter.from([[new Uint8Array(20)] as any])).toThrow(
				TopicFilter.InvalidTopicFilterError,
			);
		});

		it("throws on invalid entry type", () => {
			expect(() => TopicFilter.from([123 as any])).toThrow(
				TopicFilter.InvalidTopicFilterError,
			);
		});
	});

	describe("matches", () => {
		it("matches empty filter to any topics", () => {
			const filter = TopicFilter.from([]);
			expect(TopicFilter.matches(filter, [hash1, hash2])).toBe(true);
		});

		it("matches all wildcards to any topics", () => {
			const filter = TopicFilter.from([null, null, null]);
			expect(TopicFilter.matches(filter, [hash1, hash2, hash3])).toBe(true);
		});

		it("matches specific topic at position 0", () => {
			const filter = TopicFilter.from([hash1]);
			expect(TopicFilter.matches(filter, [hash1, hash2])).toBe(true);
			expect(TopicFilter.matches(filter, [hash2, hash1])).toBe(false);
		});

		it("matches with wildcard in middle", () => {
			const filter = TopicFilter.from([hash1, null, hash3]);
			expect(TopicFilter.matches(filter, [hash1, hash2, hash3])).toBe(true);
			expect(TopicFilter.matches(filter, [hash1, hash1, hash3])).toBe(true);
			expect(TopicFilter.matches(filter, [hash2, hash2, hash3])).toBe(false);
			expect(TopicFilter.matches(filter, [hash1, hash2, hash2])).toBe(false);
		});

		it("matches array entry (OR logic)", () => {
			const filter = TopicFilter.from([[hash1, hash2]]);
			expect(TopicFilter.matches(filter, [hash1])).toBe(true);
			expect(TopicFilter.matches(filter, [hash2])).toBe(true);
			expect(TopicFilter.matches(filter, [hash3])).toBe(false);
		});

		it("does not match when log has fewer topics", () => {
			const filter = TopicFilter.from([hash1, hash2]);
			expect(TopicFilter.matches(filter, [hash1])).toBe(false);
		});

		it("matches complex filter", () => {
			const filter = TopicFilter.from([hash1, [hash2, hash3], null]);
			expect(TopicFilter.matches(filter, [hash1, hash2, hash1])).toBe(true);
			expect(TopicFilter.matches(filter, [hash1, hash3, hash1])).toBe(true);
			expect(TopicFilter.matches(filter, [hash1, hash1, hash1])).toBe(false);
		});
	});

	describe("isEmpty", () => {
		it("returns true for empty array", () => {
			const filter = TopicFilter.from([]);
			expect(TopicFilter.isEmpty(filter)).toBe(true);
		});

		it("returns true for all nulls", () => {
			const filter = TopicFilter.from([null, null, null]);
			expect(TopicFilter.isEmpty(filter)).toBe(true);
		});

		it("returns false when has any topic", () => {
			const filter = TopicFilter.from([hash1]);
			expect(TopicFilter.isEmpty(filter)).toBe(false);
		});

		it("returns false when has topic at any position", () => {
			const filter = TopicFilter.from([null, hash2, null]);
			expect(TopicFilter.isEmpty(filter)).toBe(false);
		});
	});
});
