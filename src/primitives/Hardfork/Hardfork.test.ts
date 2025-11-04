/**
 * Tests for Hardfork module
 */

import { describe, expect, it } from "vitest";
import * as Hardfork from "./Hardfork.js";

// ============================================================================
// Comparison Operations Tests
// ============================================================================

describe("Hardfork.isAtLeast", () => {
	it("returns true when current >= target", () => {
		expect(Hardfork.isAtLeast(Hardfork.Id.CANCUN, Hardfork.Id.SHANGHAI)).toBe(
			true,
		);
		expect(Hardfork.isAtLeast(Hardfork.Id.SHANGHAI, Hardfork.Id.SHANGHAI)).toBe(
			true,
		);
	});

	it("returns false when current < target", () => {
		expect(Hardfork.isAtLeast(Hardfork.Id.BERLIN, Hardfork.Id.LONDON)).toBe(
			false,
		);
		expect(Hardfork.isAtLeast(Hardfork.Id.FRONTIER, Hardfork.Id.CANCUN)).toBe(
			false,
		);
	});
});

describe("Hardfork.isBefore", () => {
	it("returns true when current < target", () => {
		expect(Hardfork.isBefore(Hardfork.Id.BERLIN, Hardfork.Id.LONDON)).toBe(
			true,
		);
		expect(Hardfork.isBefore(Hardfork.Id.FRONTIER, Hardfork.Id.HOMESTEAD)).toBe(
			true,
		);
	});

	it("returns false when current >= target", () => {
		expect(Hardfork.isBefore(Hardfork.Id.CANCUN, Hardfork.Id.SHANGHAI)).toBe(
			false,
		);
		expect(Hardfork.isBefore(Hardfork.Id.LONDON, Hardfork.Id.LONDON)).toBe(
			false,
		);
	});
});

describe("Hardfork.isAfter", () => {
	it("returns true when current > target", () => {
		expect(Hardfork.isAfter(Hardfork.Id.CANCUN, Hardfork.Id.SHANGHAI)).toBe(
			true,
		);
		expect(Hardfork.isAfter(Hardfork.Id.PRAGUE, Hardfork.Id.BERLIN)).toBe(true);
	});

	it("returns false when current <= target", () => {
		expect(Hardfork.isAfter(Hardfork.Id.BERLIN, Hardfork.Id.LONDON)).toBe(
			false,
		);
		expect(Hardfork.isAfter(Hardfork.Id.SHANGHAI, Hardfork.Id.SHANGHAI)).toBe(
			false,
		);
	});
});

describe("Hardfork.isEqual", () => {
	it("returns true when hardforks are equal", () => {
		expect(Hardfork.isEqual(Hardfork.Id.CANCUN, Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.isEqual(Hardfork.Id.FRONTIER, Hardfork.Id.FRONTIER)).toBe(
			true,
		);
	});

	it("returns false when hardforks are not equal", () => {
		expect(Hardfork.isEqual(Hardfork.Id.CANCUN, Hardfork.Id.SHANGHAI)).toBe(
			false,
		);
		expect(Hardfork.isEqual(Hardfork.Id.BERLIN, Hardfork.Id.LONDON)).toBe(
			false,
		);
	});
});

describe("Hardfork.compare", () => {
	it("returns negative when a < b", () => {
		expect(
			Hardfork.compare(Hardfork.Id.BERLIN, Hardfork.Id.LONDON),
		).toBeLessThan(0);
		expect(
			Hardfork.compare(Hardfork.Id.FRONTIER, Hardfork.Id.CANCUN),
		).toBeLessThan(0);
	});

	it("returns zero when a == b", () => {
		expect(Hardfork.compare(Hardfork.Id.CANCUN, Hardfork.Id.CANCUN)).toBe(0);
		expect(Hardfork.compare(Hardfork.Id.SHANGHAI, Hardfork.Id.SHANGHAI)).toBe(
			0,
		);
	});

	it("returns positive when a > b", () => {
		expect(
			Hardfork.compare(Hardfork.Id.PRAGUE, Hardfork.Id.SHANGHAI),
		).toBeGreaterThan(0);
		expect(
			Hardfork.compare(Hardfork.Id.LONDON, Hardfork.Id.BERLIN),
		).toBeGreaterThan(0);
	});
});

describe("Hardfork.min", () => {
	it("returns minimum hardfork from array", () => {
		const forks = [
			Hardfork.Id.CANCUN,
			Hardfork.Id.BERLIN,
			Hardfork.Id.SHANGHAI,
		];
		expect(Hardfork.min(forks)).toBe(Hardfork.Id.BERLIN);
	});

	it("returns single element for single-element array", () => {
		expect(Hardfork.min([Hardfork.Id.CANCUN])).toBe(Hardfork.Id.CANCUN);
	});

	it("throws error for empty array", () => {
		expect(() => Hardfork.min([])).toThrow("Cannot get min of empty array");
	});
});

describe("Hardfork.max", () => {
	it("returns maximum hardfork from array", () => {
		const forks = [
			Hardfork.Id.CANCUN,
			Hardfork.Id.BERLIN,
			Hardfork.Id.SHANGHAI,
		];
		expect(Hardfork.max(forks)).toBe(Hardfork.Id.CANCUN);
	});

	it("returns single element for single-element array", () => {
		expect(Hardfork.max([Hardfork.Id.BERLIN])).toBe(Hardfork.Id.BERLIN);
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
		expect(Hardfork.fromString("cancun")).toBe(Hardfork.Id.CANCUN);
		expect(Hardfork.fromString("shanghai")).toBe(Hardfork.Id.SHANGHAI);
		expect(Hardfork.fromString("london")).toBe(Hardfork.Id.LONDON);
		expect(Hardfork.fromString("berlin")).toBe(Hardfork.Id.BERLIN);
	});

	it("handles case-insensitive input", () => {
		expect(Hardfork.fromString("Cancun")).toBe(Hardfork.Id.CANCUN);
		expect(Hardfork.fromString("SHANGHAI")).toBe(Hardfork.Id.SHANGHAI);
		expect(Hardfork.fromString("LoNdOn")).toBe(Hardfork.Id.LONDON);
	});

	it("parses alias names", () => {
		expect(Hardfork.fromString("paris")).toBe(Hardfork.Id.MERGE);
		expect(Hardfork.fromString("constantinoplefix")).toBe(
			Hardfork.Id.PETERSBURG,
		);
	});

	it("handles comparison operators in names", () => {
		expect(Hardfork.fromString(">=Cancun")).toBe(Hardfork.Id.CANCUN);
		expect(Hardfork.fromString(">Shanghai")).toBe(Hardfork.Id.SHANGHAI);
		expect(Hardfork.fromString("<London")).toBe(Hardfork.Id.LONDON);
		expect(Hardfork.fromString("<=Berlin")).toBe(Hardfork.Id.BERLIN);
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
		expect(Hardfork.toString(Hardfork.Id.CANCUN)).toBe("cancun");
		expect(Hardfork.toString(Hardfork.Id.SHANGHAI)).toBe("shanghai");
		expect(Hardfork.toString(Hardfork.Id.LONDON)).toBe("london");
		expect(Hardfork.toString(Hardfork.Id.BERLIN)).toBe("berlin");
	});

	it("returns standard name for merge (not alias)", () => {
		expect(Hardfork.toString(Hardfork.Id.MERGE)).toBe("merge");
	});

	it("returns standard name for petersburg (not alias)", () => {
		expect(Hardfork.toString(Hardfork.Id.PETERSBURG)).toBe("petersburg");
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
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.gte.call(fork, Hardfork.Id.SHANGHAI)).toBe(true);
		expect(Hardfork.gte.call(fork, Hardfork.Id.CANCUN)).toBe(true);
	});

	it("returns false when this < target", () => {
		const fork = Hardfork.Id.BERLIN;
		expect(Hardfork.gte.call(fork, Hardfork.Id.LONDON)).toBe(false);
	});
});

describe("Hardfork.lt (convenience form)", () => {
	it("returns true when this < target", () => {
		const fork = Hardfork.Id.BERLIN;
		expect(Hardfork.lt.call(fork, Hardfork.Id.LONDON)).toBe(true);
	});

	it("returns false when this >= target", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.lt.call(fork, Hardfork.Id.SHANGHAI)).toBe(false);
	});
});

describe("Hardfork.gt (convenience form)", () => {
	it("returns true when this > target", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.gt.call(fork, Hardfork.Id.SHANGHAI)).toBe(true);
	});

	it("returns false when this <= target", () => {
		const fork = Hardfork.Id.BERLIN;
		expect(Hardfork.gt.call(fork, Hardfork.Id.LONDON)).toBe(false);
		expect(Hardfork.gt.call(fork, Hardfork.Id.BERLIN)).toBe(false);
	});
});

describe("Hardfork.eq (convenience form)", () => {
	it("returns true when this == other", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.eq.call(fork, Hardfork.Id.CANCUN)).toBe(true);
	});

	it("returns false when this != other", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.eq.call(fork, Hardfork.Id.SHANGHAI)).toBe(false);
	});
});

describe("Hardfork.lte (convenience form)", () => {
	it("returns true when this <= target", () => {
		const fork = Hardfork.Id.SHANGHAI;
		expect(Hardfork.lte.call(fork, Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.lte.call(fork, Hardfork.Id.SHANGHAI)).toBe(true);
	});

	it("returns false when this > target", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.lte.call(fork, Hardfork.Id.SHANGHAI)).toBe(false);
	});
});

// ============================================================================
// Feature Detection Tests
// ============================================================================

describe("Hardfork.hasEIP1559", () => {
	it("returns true for London and later", () => {
		expect(Hardfork.hasEIP1559(Hardfork.Id.LONDON)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.Id.MERGE)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.Id.SHANGHAI)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP1559(Hardfork.Id.PRAGUE)).toBe(true);
	});

	it("returns false for pre-London", () => {
		expect(Hardfork.hasEIP1559(Hardfork.Id.BERLIN)).toBe(false);
		expect(Hardfork.hasEIP1559(Hardfork.Id.ISTANBUL)).toBe(false);
		expect(Hardfork.hasEIP1559(Hardfork.Id.FRONTIER)).toBe(false);
	});
});

describe("Hardfork.supportsEIP1559 (convenience form)", () => {
	it("returns true for London and later", () => {
		const fork = Hardfork.Id.LONDON;
		expect(Hardfork.supportsEIP1559.call(fork)).toBe(true);
	});

	it("returns false for pre-London", () => {
		const fork = Hardfork.Id.BERLIN;
		expect(Hardfork.supportsEIP1559.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP3855", () => {
	it("returns true for Shanghai and later", () => {
		expect(Hardfork.hasEIP3855(Hardfork.Id.SHANGHAI)).toBe(true);
		expect(Hardfork.hasEIP3855(Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP3855(Hardfork.Id.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Shanghai", () => {
		expect(Hardfork.hasEIP3855(Hardfork.Id.MERGE)).toBe(false);
		expect(Hardfork.hasEIP3855(Hardfork.Id.LONDON)).toBe(false);
		expect(Hardfork.hasEIP3855(Hardfork.Id.BERLIN)).toBe(false);
	});
});

describe("Hardfork.supportsPUSH0 (convenience form)", () => {
	it("returns true for Shanghai and later", () => {
		const fork = Hardfork.Id.SHANGHAI;
		expect(Hardfork.supportsPUSH0.call(fork)).toBe(true);
	});

	it("returns false for pre-Shanghai", () => {
		const fork = Hardfork.Id.MERGE;
		expect(Hardfork.supportsPUSH0.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP4844", () => {
	it("returns true for Cancun and later", () => {
		expect(Hardfork.hasEIP4844(Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP4844(Hardfork.Id.PRAGUE)).toBe(true);
		expect(Hardfork.hasEIP4844(Hardfork.Id.OSAKA)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		expect(Hardfork.hasEIP4844(Hardfork.Id.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP4844(Hardfork.Id.MERGE)).toBe(false);
		expect(Hardfork.hasEIP4844(Hardfork.Id.LONDON)).toBe(false);
	});
});

describe("Hardfork.supportsBlobs (convenience form)", () => {
	it("returns true for Cancun and later", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.supportsBlobs.call(fork)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		const fork = Hardfork.Id.SHANGHAI;
		expect(Hardfork.supportsBlobs.call(fork)).toBe(false);
	});
});

describe("Hardfork.hasEIP1153", () => {
	it("returns true for Cancun and later", () => {
		expect(Hardfork.hasEIP1153(Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.hasEIP1153(Hardfork.Id.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		expect(Hardfork.hasEIP1153(Hardfork.Id.SHANGHAI)).toBe(false);
		expect(Hardfork.hasEIP1153(Hardfork.Id.MERGE)).toBe(false);
	});
});

describe("Hardfork.supportsTransientStorage (convenience form)", () => {
	it("returns true for Cancun and later", () => {
		const fork = Hardfork.Id.CANCUN;
		expect(Hardfork.supportsTransientStorage.call(fork)).toBe(true);
	});

	it("returns false for pre-Cancun", () => {
		const fork = Hardfork.Id.SHANGHAI;
		expect(Hardfork.supportsTransientStorage.call(fork)).toBe(false);
	});
});

describe("Hardfork.isPostMerge", () => {
	it("returns true for Merge and later", () => {
		expect(Hardfork.isPostMerge(Hardfork.Id.MERGE)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.Id.SHANGHAI)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.Id.CANCUN)).toBe(true);
		expect(Hardfork.isPostMerge(Hardfork.Id.PRAGUE)).toBe(true);
	});

	it("returns false for pre-Merge", () => {
		expect(Hardfork.isPostMerge(Hardfork.Id.GRAY_GLACIER)).toBe(false);
		expect(Hardfork.isPostMerge(Hardfork.Id.LONDON)).toBe(false);
		expect(Hardfork.isPostMerge(Hardfork.Id.BERLIN)).toBe(false);
	});
});

describe("Hardfork.isPoS (convenience form)", () => {
	it("returns true for Merge and later", () => {
		const fork = Hardfork.Id.MERGE;
		expect(Hardfork.isPoS.call(fork)).toBe(true);
	});

	it("returns false for pre-Merge", () => {
		const fork = Hardfork.Id.LONDON;
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
		expect(ids).toContain(Hardfork.Id.CANCUN);
		expect(ids).toContain(Hardfork.Id.SHANGHAI);
		expect(ids).toContain(Hardfork.Id.MERGE);
	});

	it("all IDs are numbers", () => {
		const ids = Hardfork.allIds();
		for (const id of ids) {
			expect(typeof id).toBe("number");
		}
	});

	it("IDs are in ascending order", () => {
		const ids = Hardfork.allIds();
		for (let i = 1; i < ids.length; i++) {
			expect(ids[i]!).toBeGreaterThan(ids[i - 1]!);
		}
	});
});

describe("Hardfork.range", () => {
	it("returns range in ascending order", () => {
		const range = Hardfork.range(Hardfork.Id.BERLIN, Hardfork.Id.SHANGHAI);
		expect(range).toEqual([
			Hardfork.Id.BERLIN,
			Hardfork.Id.LONDON,
			Hardfork.Id.ARROW_GLACIER,
			Hardfork.Id.GRAY_GLACIER,
			Hardfork.Id.MERGE,
			Hardfork.Id.SHANGHAI,
		]);
	});

	it("returns range in descending order when start > end", () => {
		const range = Hardfork.range(Hardfork.Id.SHANGHAI, Hardfork.Id.BERLIN);
		expect(range).toEqual([
			Hardfork.Id.SHANGHAI,
			Hardfork.Id.MERGE,
			Hardfork.Id.GRAY_GLACIER,
			Hardfork.Id.ARROW_GLACIER,
			Hardfork.Id.LONDON,
			Hardfork.Id.BERLIN,
		]);
	});

	it("returns single element when start == end", () => {
		const range = Hardfork.range(Hardfork.Id.CANCUN, Hardfork.Id.CANCUN);
		expect(range).toEqual([Hardfork.Id.CANCUN]);
	});

	it("returns adjacent hardforks", () => {
		const range = Hardfork.range(Hardfork.Id.BERLIN, Hardfork.Id.LONDON);
		expect(range).toEqual([Hardfork.Id.BERLIN, Hardfork.Id.LONDON]);
	});
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe("Hardfork edge cases", () => {
	it("DEFAULT is set to PRAGUE", () => {
		expect(Hardfork.DEFAULT).toBe(Hardfork.Id.PRAGUE);
	});

	it("fromString roundtrips with toString", () => {
		const ids = Hardfork.allIds();
		for (const id of ids) {
			const name = Hardfork.toString(id);
			expect(Hardfork.fromString(name)).toBe(id);
		}
	});

	it("handles all hardfork IDs correctly", () => {
		expect(Hardfork.Id.FRONTIER).toBe(0);
		expect(Hardfork.Id.HOMESTEAD).toBe(1);
		expect(Hardfork.Id.DAO).toBe(2);
		expect(Hardfork.Id.TANGERINE_WHISTLE).toBe(3);
		expect(Hardfork.Id.SPURIOUS_DRAGON).toBe(4);
		expect(Hardfork.Id.BYZANTIUM).toBe(5);
		expect(Hardfork.Id.CONSTANTINOPLE).toBe(6);
		expect(Hardfork.Id.PETERSBURG).toBe(7);
		expect(Hardfork.Id.ISTANBUL).toBe(8);
		expect(Hardfork.Id.MUIR_GLACIER).toBe(9);
		expect(Hardfork.Id.BERLIN).toBe(10);
		expect(Hardfork.Id.LONDON).toBe(11);
		expect(Hardfork.Id.ARROW_GLACIER).toBe(12);
		expect(Hardfork.Id.GRAY_GLACIER).toBe(13);
		expect(Hardfork.Id.MERGE).toBe(14);
		expect(Hardfork.Id.SHANGHAI).toBe(15);
		expect(Hardfork.Id.CANCUN).toBe(16);
		expect(Hardfork.Id.PRAGUE).toBe(17);
		expect(Hardfork.Id.OSAKA).toBe(18);
	});

	it("comparison operations work across full range", () => {
		expect(Hardfork.isAtLeast(Hardfork.Id.OSAKA, Hardfork.Id.FRONTIER)).toBe(
			true,
		);
		expect(Hardfork.isBefore(Hardfork.Id.FRONTIER, Hardfork.Id.OSAKA)).toBe(
			true,
		);
	});
});
