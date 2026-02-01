import { describe, expect, it } from "vitest";
import * as FilterId from "../FilterId/index.js";
import * as BlockFilter from "./index.js";

describe("BlockFilter", () => {
	describe("from", () => {
		it("creates BlockFilter from filter ID", () => {
			const filterId = FilterId.from("0x1");
			const filter = BlockFilter.from(filterId);
			expect(filter.filterId).toBe(filterId);
			expect(filter.type).toBe("block");
		});

		it("creates multiple distinct filters", () => {
			const id1 = FilterId.from("0x1");
			const id2 = FilterId.from("0x2");
			const filter1 = BlockFilter.from(id1);
			const filter2 = BlockFilter.from(id2);
			expect(filter1.filterId).toBe(id1);
			expect(filter2.filterId).toBe(id2);
			expect(filter1.filterId).not.toBe(filter2.filterId);
		});
	});
});
