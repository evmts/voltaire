/**
 * Tests for Hardfork module
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./index.js";

// ============================================================================
// Comparison Operations Tests
// ============================================================================

describe("Hardfork.isAtLeast", () => {
	it("returns true when current >= target", () => {
		expect(Hardfork.isAtLeast(Hardfork.CANCUN, Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.isAtLeast(Hardfork.SHANGHAI, Hardfork.SHANGHAI)).toBe(true);
	});

	it("returns false when current < target", () => {
		expect(Hardfork.isAtLeast(Hardfork.BERLIN, Hardfork.LONDON)).toBe(false);
		expect(Hardfork.isAtLeast(Hardfork.FRONTIER, Hardfork.CANCUN)).toBe(false);
	});
});

describe("Hardfork.isBefore", () => {
	it("returns true when current < target", () => {
		expect(Hardfork.isBefore(Hardfork.BERLIN, Hardfork.LONDON)).toBe(true);
		expect(Hardfork.isBefore(Hardfork.FRONTIER, Hardfork.HOMESTEAD)).toBe(true);
	});

	it("returns false when current >= target", () => {
		expect(Hardfork.isBefore(Hardfork.CANCUN, Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.isBefore(Hardfork.LONDON, Hardfork.LONDON)).toBe(false);
	});
});

describe("Hardfork.isAfter", () => {
	it("returns true when current > target", () => {
		expect(Hardfork.isAfter(Hardfork.CANCUN, Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.isAfter(Hardfork.PRAGUE, Hardfork.BERLIN)).toBe(true);
	});

	it("returns false when current <= target", () => {
		expect(Hardfork.isAfter(Hardfork.BERLIN, Hardfork.LONDON)).toBe(false);
		expect(Hardfork.isAfter(Hardfork.SHANGHAI, Hardfork.SHANGHAI)).toBe(false);
	});
});

describe("Hardfork.isEqual", () => {
	it("returns true when hardforks are equal", () => {
		expect(Hardfork.isEqual(Hardfork.CANCUN, Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.isEqual(Hardfork.FRONTIER, Hardfork.FRONTIER)).toBe(true);
	});

	it("returns false when hardforks are not equal", () => {
		expect(Hardfork.isEqual(Hardfork.CANCUN, Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.isEqual(Hardfork.BERLIN, Hardfork.LONDON)).toBe(false);
	});
});

describe("Hardfork.compare", () => {
	it("returns negative when a < b", () => {
		expect(Hardfork.compare(Hardfork.BERLIN, Hardfork.LONDON)).toBeLessThan(0);
		expect(Hardfork.compare(Hardfork.FRONTIER, Hardfork.CANCUN)).toBeLessThan(
			0,
		);
	});

	it("returns zero when a == b", () => {
		expect(Hardfork.compare(Hardfork.CANCUN, Hardfork.CANCUN)).toBe(0);
		expect(Hardfork.compare(Hardfork.SHANGHAI, Hardfork.SHANGHAI)).toBe(0);
	});

	it("returns positive when a > b", () => {
		expect(
			Hardfork.compare(Hardfork.PRAGUE, Hardfork.SHANGHAI),
		).toBeGreaterThan(0);
		expect(Hardfork.compare(Hardfork.LONDON, Hardfork.BERLIN)).toBeGreaterThan(
			0,
		);
	});
});

describe("Hardfork.min", () => {
	it("returns minimum hardfork from array", () => {
		const forks = [Hardfork.CANCUN, Hardfork.BERLIN, Hardfork.SHANGHAI];
		expect(Hardfork.min(forks)).toBe(Hardfork.BERLIN);
	});

	it("returns single element for single-element array", () => {
		expect(Hardfork.min([Hardfork.CANCUN])).toBe(Hardfork.CANCUN);
	});

	it("throws error for empty array", () => {
		expect(() => Hardfork.min([])).toThrow("Cannot get min of empty array");
	});
});

describe("Hardfork.max", () => {
	it("returns maximum hardfork from array", () => {
		const forks = [Hardfork.CANCUN, Hardfork.BERLIN, Hardfork.SHANGHAI];
		expect(Hardfork.max(forks)).toBe(Hardfork.CANCUN);
	});

	it("returns single element for single-element array", () => {
		expect(Hardfork.max([Hardfork.BERLIN])).toBe(Hardfork.BERLIN);
	});

	it("throws error for empty array", () => {
		expect(() => Hardfork.max([])).toThrow("Cannot get max of empty array");
	});
});

// ============================================================================
// String Conversion Tests
// ============================================================================

describe("Hardfork.fromString", () => {
	it("parses standard hardfork names", () => {
		expect(Hardfork.fromString("cancun")).toBe(Hardfork.CANCUN);
		expect(Hardfork.fromString("shanghai")).toBe(Hardfork.SHANGHAI);
		expect(Hardfork.fromString("london")).toBe(Hardfork.LONDON);
		expect(Hardfork.fromString("berlin")).toBe(Hardfork.BERLIN);
	});

	it("handles case-insensitive input", () => {
		expect(Hardfork.fromString("Cancun")).toBe(Hardfork.CANCUN);
		expect(Hardfork.fromString("SHANGHAI")).toBe(Hardfork.SHANGHAI);
		expect(Hardfork.fromString("LoNdOn")).toBe(Hardfork.LONDON);
	});

	it("parses alias names", () => {
		expect(Hardfork.fromString("paris")).toBe(Hardfork.MERGE);
		expect(Hardfork.fromString("constantinoplefix")).toBe(Hardfork.PETERSBURG);
	});

	it("handles comparison operators in names", () => {
		expect(Hardfork.fromString(">=Cancun")).toBe(Hardfork.CANCUN);
		expect(Hardfork.fromString(">Shanghai")).toBe(Hardfork.SHANGHAI);
		expect(Hardfork.fromString("<London")).toBe(Hardfork.LONDON);
		expect(Hardfork.fromString("<=Berlin")).toBe(Hardfork.BERLIN);
	});

	it("returns undefined for invalid names", () => {
		expect(Hardfork.fromString("unknown")).toBeUndefined();
		expect(Hardfork.fromString("")).toBeUndefined();
		expect(Hardfork.fromString("not-a-fork")).toBeUndefined();
	});

	it("parses all valid hardfork names", () => {
		const validNames = [
			"frontier",
			"homestead",
			"dao",
			"tangerinewhistle",
			"spuriousdragon",
			"byzantium",
			"constantinople",
			"petersburg",
			"constantinoplefix",
			"istanbul",
			"muirglacier",
			"berlin",
			"london",
			"arrowglacier",
			"grayglacier",
			"merge",
			"paris",
			"shanghai",
			"cancun",
			"prague",
			"osaka",
		];

		for (const name of validNames) {
			expect(Hardfork.fromString(name)).toBeDefined();
		}
	});
});

describe("Hardfork.toString", () => {
	it("converts hardfork to string name", () => {
		expect(Hardfork.toString(Hardfork.CANCUN)).toBe("cancun");
		expect(Hardfork.toString(Hardfork.SHANGHAI)).toBe("shanghai");
		expect(Hardfork.toString(Hardfork.LONDON)).toBe("london");
		expect(Hardfork.toString(Hardfork.BERLIN)).toBe("berlin");
	});

	it("returns standard name for merge (not alias)", () => {
		expect(Hardfork.toString(Hardfork.MERGE)).toBe("merge");
	});

	it("returns standard name for petersburg (not alias)", () => {
		expect(Hardfork.toString(Hardfork.PETERSBURG)).toBe("petersburg");
	});

	it("converts all hardfork IDs", () => {
		const ids = Hardfork.allIds();
		for (const id of ids) {
			const name = Hardfork.toString(id);
			expect(typeof name).toBe("string");
			expect(name.length).toBeGreaterThan(0);
		}
	});
});

describe("Hardfork.isValidName", () => {
	it("returns true for valid names", () => {
		expect(Hardfork.isValidName("cancun")).toBe(true);
		expect(Hardfork.isValidName("shanghai")).toBe(true);
		expect(Hardfork.isValidName("paris")).toBe(true);
		expect(Hardfork.isValidName("constantinoplefix")).toBe(true);
	});

	it("returns true for case-insensitive valid names", () => {
		expect(Hardfork.isValidName("Cancun")).toBe(true);
		expect(Hardfork.isValidName("SHANGHAI")).toBe(true);
	});

	it("returns false for invalid names", () => {
		expect(Hardfork.isValidName("unknown")).toBe(false);
		expect(Hardfork.isValidName("")).toBe(false);
		expect(Hardfork.isValidName("not-a-fork")).toBe(false);
	});
});

// ============================================================================
// Convenience Form Tests
// ============================================================================

describe("Hardfork.gte (convenience form)", () => {
	it("returns true when this >= target", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.gte.call(fork, Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.gte.call(fork, Hardfork.CANCUN)).toBe(true);
	});

	it("returns false when this < target", () => {
		const fork = Hardfork.BERLIN;
		expect(Hardfork.gte.call(fork, Hardfork.LONDON)).toBe(false);
	});
});

describe("Hardfork.lt (convenience form)", () => {
	it("returns true when this < target", () => {
		const fork = Hardfork.BERLIN;
		expect(Hardfork.lt.call(fork, Hardfork.LONDON)).toBe(true);
	});

	it("returns false when this >= target", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.lt.call(fork, Hardfork.SHANGHAI)).toBe(false);
	});
});

describe("Hardfork.gt (convenience form)", () => {
	it("returns true when this > target", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.gt.call(fork, Hardfork.SHANGHAI)).toBe(true);
	});

	it("returns false when this <= target", () => {
		const fork = Hardfork.BERLIN;
		expect(Hardfork.gt.call(fork, Hardfork.LONDON)).toBe(false);
		expect(Hardfork.gt.call(fork, Hardfork.BERLIN)).toBe(false);
	});
});

describe("Hardfork.equals (convenience form)", () => {
	it("returns true when this == other", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.equals.call(fork, Hardfork.CANCUN)).toBe(true);
	});

	it("returns false when this != other", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.equals.call(fork, Hardfork.SHANGHAI)).toBe(false);
	});
});

describe("Hardfork.lte (convenience form)", () => {
	it("returns true when this <= target", () => {
		const fork = Hardfork.SHANGHAI;
		expect(Hardfork.lte.call(fork, Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.lte.call(fork, Hardfork.SHANGHAI)).toBe(true);
	});

	it("returns false when this > target", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.lte.call(fork, Hardfork.SHANGHAI)).toBe(false);
	});
});

// ============================================================================
// Feature Detection Tests
// ============================================================================

describe("Hardfork.hasEIP1559", () => {
	it("returns true for London and later", () => {
		expect(Hardfork.hasEIP1559(Hardfork.LONDON)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.MERGE)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for pre-London", () => {
		expect(Hardfork.hasEIP1559(Hardfork.BERLIN)).toBe(false);
		expect(Hardfork.hasEIP1559(Hardfork.ISTANBUL)).toBe(false);
		expect(Hardfork.hasEIP1559(Hardfork.FRONTIER)).toBe(false);
	});
});

describe("Hardfork.supportsEIP1559 (convenience form)", () => {
	it("returns true for London and later", () => {
		const fork = Hardfork.LONDON;
		expect(Hardfork.supportsEIP1559.call(fork)).toBe(true);
	});

	it("returns false for pre-London", () => {
		const fork = Hardfork.BERLIN;
		expect(Hardfork.supportsEIP1559.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP3855", () => {
	it("returns true for Shanghai and later", () => {
		expect(Hardfork.hasEIP3855(Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.hasEIP3855(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP3855(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Shanghai", () => {
		expect(Hardfork.hasEIP3855(Hardfork.MERGE)).toBe(false);
		expect(Hardfork.hasEIP3855(Hardfork.LONDON)).toBe(false);
		expect(Hardfork.hasEIP3855(Hardfork.BERLIN)).toBe(false);
	});
});

describe("Hardfork.supportsPUSH0 (convenience form)", () => {
	it("returns true for Shanghai and later", () => {
		const fork = Hardfork.SHANGHAI;
		expect(Hardfork.supportsPUSH0.call(fork)).toBe(true);
	});

	it("returns false for pre-Shanghai", () => {
		const fork = Hardfork.MERGE;
		expect(Hardfork.supportsPUSH0.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP4844", () => {
	it("returns true for Cancun and later", () => {
		expect(Hardfork.hasEIP4844(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP4844(Hardfork.PRAGUE)).toBe(true);
		expect(Hardfork.hasEIP4844(Hardfork.OSAKA)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		expect(Hardfork.hasEIP4844(Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP4844(Hardfork.MERGE)).toBe(false);
		expect(Hardfork.hasEIP4844(Hardfork.LONDON)).toBe(false);
	});
});

describe("Hardfork.supportsBlobs (convenience form)", () => {
	it("returns true for Cancun and later", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.supportsBlobs.call(fork)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		const fork = Hardfork.SHANGHAI;
		expect(Hardfork.supportsBlobs.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP1153", () => {
	it("returns true for Cancun and later", () => {
		expect(Hardfork.hasEIP1153(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP1153(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		expect(Hardfork.hasEIP1153(Hardfork.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP1153(Hardfork.MERGE)).toBe(false);
	});
});

describe("Hardfork.supportsTransientStorage (convenience form)", () => {
	it("returns true for Cancun and later", () => {
		const fork = Hardfork.CANCUN;
		expect(Hardfork.supportsTransientStorage.call(fork)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		const fork = Hardfork.SHANGHAI;
		expect(Hardfork.supportsTransientStorage.call(fork)).toBe(false);
	});
});

describe("Hardfork.isPostMerge", () => {
	it("returns true for Merge and later", () => {
		expect(Hardfork.isPostMerge(Hardfork.MERGE)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.SHANGHAI)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.CANCUN)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Merge", () => {
		expect(Hardfork.isPostMerge(Hardfork.GRAY_GLACIER)).toBe(false);
		expect(Hardfork.isPostMerge(Hardfork.LONDON)).toBe(false);
		expect(Hardfork.isPostMerge(Hardfork.BERLIN)).toBe(false);
	});
});

describe("Hardfork.isPoS (convenience form)", () => {
	it("returns true for Merge and later", () => {
		const fork = Hardfork.MERGE;
		expect(Hardfork.isPoS.call(fork)).toBe(true);
	});

	it("returns false for pre-Merge", () => {
		const fork = Hardfork.LONDON;
		expect(Hardfork.isPoS.call(fork)).toBe(false);
	});
});

// ============================================================================
// Utility Tests
// ============================================================================

describe("Hardfork.allNames", () => {
	it("returns array of all hardfork names", () => {
		const names = Hardfork.allNames();
		expect(Array.isArray(names)).toBe(true);
		expect(names.length).toBeGreaterThan(0);
		expect(names).toContain("cancun");
		expect(names).toContain("shanghai");
		expect(names).toContain("merge");
	});

	it("all names are valid", () => {
		const names = Hardfork.allNames();
		for (const name of names) {
			expect(typeof name).toBe("string");
			expect(Hardfork.isValidName(name)).toBe(true);
		}
	});
});

describe("Hardfork.allIds", () => {
	it("returns array of all hardfork IDs", () => {
		const ids = Hardfork.allIds();
		expect(Array.isArray(ids)).toBe(true);
		expect(ids.length).toBeGreaterThan(0);
		expect(ids).toContain(Hardfork.CANCUN);
		expect(ids).toContain(Hardfork.SHANGHAI);
		expect(ids).toContain(Hardfork.MERGE);
	});

	it("all IDs are strings", () => {
		const ids = Hardfork.allIds();
		for (const id of ids) {
			expect(typeof id).toBe("string");
		}
	});
});

describe("Hardfork.range", () => {
	it("returns range in ascending order", () => {
		const range = Hardfork.range(Hardfork.BERLIN, Hardfork.SHANGHAI);
		expect(range).toEqual([
			Hardfork.BERLIN,
			Hardfork.LONDON,
			Hardfork.ARROW_GLACIER,
			Hardfork.GRAY_GLACIER,
			Hardfork.MERGE,
			Hardfork.SHANGHAI,
		]);
	});

	it("returns range in descending order when start > end", () => {
		const range = Hardfork.range(Hardfork.SHANGHAI, Hardfork.BERLIN);
		expect(range).toEqual([
			Hardfork.SHANGHAI,
			Hardfork.MERGE,
			Hardfork.GRAY_GLACIER,
			Hardfork.ARROW_GLACIER,
			Hardfork.LONDON,
			Hardfork.BERLIN,
		]);
	});

	it("returns single element when start == end", () => {
		const range = Hardfork.range(Hardfork.CANCUN, Hardfork.CANCUN);
		expect(range).toEqual([Hardfork.CANCUN]);
	});

	it("returns adjacent hardforks", () => {
		const range = Hardfork.range(Hardfork.BERLIN, Hardfork.LONDON);
		expect(range).toEqual([Hardfork.BERLIN, Hardfork.LONDON]);
	});
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe("Hardfork edge cases", () => {
	it("DEFAULT is set to PRAGUE", () => {
		expect(Hardfork.DEFAULT).toBe(Hardfork.PRAGUE);
	});

	it("fromString roundtrips with toString", () => {
		const ids = Hardfork.allIds();
		for (const id of ids) {
			const name = Hardfork.toString(id);
			expect(Hardfork.fromString(name)).toBe(id);
		}
	});

	it("handles all hardfork IDs correctly", () => {
		expect(Hardfork.FRONTIER).toBe("frontier");
		expect(Hardfork.HOMESTEAD).toBe("homestead");
		expect(Hardfork.DAO).toBe("dao");
		expect(Hardfork.TANGERINE_WHISTLE).toBe("tangerinewhistle");
		expect(Hardfork.SPURIOUS_DRAGON).toBe("spuriousdragon");
		expect(Hardfork.BYZANTIUM).toBe("byzantium");
		expect(Hardfork.CONSTANTINOPLE).toBe("constantinople");
		expect(Hardfork.PETERSBURG).toBe("petersburg");
		expect(Hardfork.ISTANBUL).toBe("istanbul");
		expect(Hardfork.MUIR_GLACIER).toBe("muirglacier");
		expect(Hardfork.BERLIN).toBe("berlin");
		expect(Hardfork.LONDON).toBe("london");
		expect(Hardfork.ARROW_GLACIER).toBe("arrowglacier");
		expect(Hardfork.GRAY_GLACIER).toBe("grayglacier");
		expect(Hardfork.MERGE).toBe("merge");
		expect(Hardfork.SHANGHAI).toBe("shanghai");
		expect(Hardfork.CANCUN).toBe("cancun");
		expect(Hardfork.PRAGUE).toBe("prague");
		expect(Hardfork.OSAKA).toBe("osaka");
	});

	it("comparison operations work across full range", () => {
		expect(Hardfork.isAtLeast(Hardfork.OSAKA, Hardfork.FRONTIER)).toBe(true);
		expect(Hardfork.isBefore(Hardfork.FRONTIER, Hardfork.OSAKA)).toBe(true);
	});
});
