import { describe, expect, it } from "vitest";
import * as SourceMap from "./index.js";

describe("SourceMap", () => {
	describe("from", () => {
		it("creates source map from string", () => {
			const map = SourceMap.from("0:50:0:-;51:100:0:-;151:25:0:o");
			expect(map.raw).toBe("0:50:0:-;51:100:0:-;151:25:0:o");
			expect(map.entries.length).toBe(3);
		});
	});

	describe("parse", () => {
		it("parses basic source map", () => {
			const map = SourceMap.parse("0:50:0:-;51:100:0:-;151:25:0:o");
			expect(map.entries.length).toBe(3);

			expect(map.entries[0]?.start).toBe(0);
			expect(map.entries[0]?.length).toBe(50);
			expect(map.entries[0]?.fileIndex).toBe(0);
			expect(map.entries[0]?.jump).toBe("-");

			expect(map.entries[1]?.start).toBe(51);
			expect(map.entries[1]?.length).toBe(100);
			expect(map.entries[1]?.fileIndex).toBe(0);
			expect(map.entries[1]?.jump).toBe("-");

			expect(map.entries[2]?.start).toBe(151);
			expect(map.entries[2]?.length).toBe(25);
			expect(map.entries[2]?.fileIndex).toBe(0);
			expect(map.entries[2]?.jump).toBe("o");
		});

		it("handles compressed entries (inherited fields)", () => {
			const map = SourceMap.parse("0:50:0:-;::1:i;");
			expect(map.entries.length).toBe(3);

			expect(map.entries[0]?.start).toBe(0);
			expect(map.entries[0]?.length).toBe(50);
			expect(map.entries[0]?.fileIndex).toBe(0);
			expect(map.entries[0]?.jump).toBe("-");

			// Second entry: inherits start and length, changes fileIndex and jump
			expect(map.entries[1]?.start).toBe(0);
			expect(map.entries[1]?.length).toBe(50);
			expect(map.entries[1]?.fileIndex).toBe(1);
			expect(map.entries[1]?.jump).toBe("i");

			// Third entry: empty, inherits all
			expect(map.entries[2]?.start).toBe(0);
			expect(map.entries[2]?.length).toBe(50);
			expect(map.entries[2]?.fileIndex).toBe(1);
			expect(map.entries[2]?.jump).toBe("i");
		});

		it("handles modifier depth", () => {
			const map = SourceMap.parse("0:50:0:-:1;51:100:0:-:2");
			expect(map.entries.length).toBe(2);

			expect(map.entries[0]?.modifierDepth).toBe(1);
			expect(map.entries[1]?.modifierDepth).toBe(2);
		});

		it("handles empty string", () => {
			const map = SourceMap.parse("");
			expect(map.entries.length).toBe(0);
		});
	});

	describe("toEntries", () => {
		it("converts string to entries array", () => {
			const entries = SourceMap.toEntries("0:50:0:-;51:100:0:-");
			expect(entries.length).toBe(2);
			expect(entries[0]?.start).toBe(0);
			expect(entries[1]?.start).toBe(51);
		});
	});

	describe("toString", () => {
		it("converts source map to compressed string", () => {
			const map = SourceMap.from("0:50:0:-;51:100:0:-;151:25:0:o");
			const str = SourceMap.toString(map);
			expect(str).toContain("0:50:0:-");
			expect(str).toContain("51:100");
			expect(str).toContain("151:25");
		});

		it("handles empty source map", () => {
			const map: import("./SourceMapType.js").SourceMap = {
				raw: "",
				entries: [],
			};
			const str = SourceMap.toString(map);
			expect(str).toBe("");
		});

		it("applies compression (omits duplicate fields)", () => {
			const map: import("./SourceMapType.js").SourceMap = {
				raw: "",
				entries: [
					{ start: 0, length: 50, fileIndex: 0, jump: "-" },
					{ start: 0, length: 50, fileIndex: 0, jump: "-" },
				],
			};
			const str = SourceMap.toString(map);
			// Second entry should be compressed (omits all duplicate fields)
			expect(str).toBe("0:50:0:-;:::");
		});
	});

	describe("getEntryAt", () => {
		it("gets entry at specific position", () => {
			const map = SourceMap.from("0:50:0:-;51:100:0:-;151:25:0:o");
			const entry = SourceMap.getEntryAt(map, 1);
			expect(entry?.start).toBe(51);
			expect(entry?.length).toBe(100);
		});

		it("returns undefined for out of bounds", () => {
			const map = SourceMap.from("0:50:0:-");
			expect(SourceMap.getEntryAt(map, -1)).toBeUndefined();
			expect(SourceMap.getEntryAt(map, 10)).toBeUndefined();
		});
	});
});
