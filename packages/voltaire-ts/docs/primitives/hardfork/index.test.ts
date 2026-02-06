/**
 * Tests for docs/primitives/hardfork/index.mdx
 *
 * Validates that all code examples in the Hardfork documentation work correctly.
 * Hardfork provides Ethereum network upgrade identification and comparison.
 */
import { describe, expect, it } from "vitest";

describe("Hardfork Documentation - index.mdx", () => {
	describe("Constructors", () => {
		it("should parse hardfork from string with fromString()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			expect(london).toBeDefined();

			const invalid = Hardfork.fromString("notahardfork");
			expect(invalid).toBeUndefined();
		});

		it("should convert hardfork to string with toString()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			expect(london).toBeDefined();
			if (london) {
				const str = Hardfork.toString(london);
				expect(str.toLowerCase()).toBe("london");
			}
		});
	});

	describe("Validation", () => {
		it("should validate hardfork names with isValidName()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			expect(Hardfork.isValidName("london")).toBe(true);
			expect(Hardfork.isValidName("berlin")).toBe(true);
			expect(Hardfork.isValidName("cancun")).toBe(true);
			expect(Hardfork.isValidName("shanghai")).toBe(true);
			expect(Hardfork.isValidName("notahardfork")).toBe(false);
		});
	});

	describe("Comparison - isAtLeast", () => {
		it("should check if fork is at least another fork with isAtLeast()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && berlin && cancun) {
				// London is at least Berlin (London came after)
				expect(Hardfork.isAtLeast(london, berlin)).toBe(true);
				// Berlin is not at least London
				expect(Hardfork.isAtLeast(berlin, london)).toBe(false);
				// Cancun is at least London
				expect(Hardfork.isAtLeast(cancun, london)).toBe(true);
			}
		});
	});

	describe("Comparison - isBefore/isAfter", () => {
		it("should check if fork is before another with isBefore()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && cancun) {
				expect(Hardfork.isBefore(london, cancun)).toBe(true);
				expect(Hardfork.isBefore(cancun, london)).toBe(false);
			}
		});

		it("should check if fork is after another with isAfter()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && cancun) {
				expect(Hardfork.isAfter(cancun, london)).toBe(true);
				expect(Hardfork.isAfter(london, cancun)).toBe(false);
			}
		});
	});

	describe("Comparison Operators", () => {
		it("should compare with gt() (greater than)", async () => {
			const { Hardfork, gt } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();

			if (london && berlin) {
				// gt is a method that uses `this` context
				expect(gt.call(london, berlin)).toBe(true);
				expect(gt.call(berlin, london)).toBe(false);
			}
		});

		it("should compare with gte() (greater than or equal)", async () => {
			const { Hardfork, gte } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const london2 = Hardfork.fromString("london");

			expect(london).toBeDefined();
			expect(london2).toBeDefined();

			if (london && london2) {
				// gte is a method that uses `this` context
				expect(gte.call(london, london2)).toBe(true);
			}
		});

		it("should compare with lt() (less than)", async () => {
			const { Hardfork, lt } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && cancun) {
				// lt is a method that uses `this` context
				expect(lt.call(london, cancun)).toBe(true);
				expect(lt.call(cancun, london)).toBe(false);
			}
		});

		it("should compare with lte() (less than or equal)", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const london2 = Hardfork.fromString("london");

			expect(london).toBeDefined();
			expect(london2).toBeDefined();

			if (london && london2) {
				expect(Hardfork.lte(london, london2)).toBe(true);
			}
		});

		it("should check equality with equals()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const london2 = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");

			expect(london).toBeDefined();
			expect(london2).toBeDefined();
			expect(berlin).toBeDefined();

			if (london && london2 && berlin) {
				expect(Hardfork.equals(london, london2)).toBe(true);
				expect(Hardfork.equals(london, berlin)).toBe(false);
			}
		});

		it("should compare with compare()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");
			const london2 = Hardfork.fromString("london");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();
			expect(london2).toBeDefined();

			if (london && berlin && london2) {
				expect(Hardfork.compare(london, berlin)).toBeGreaterThan(0);
				expect(Hardfork.compare(berlin, london)).toBeLessThan(0);
				expect(Hardfork.compare(london, london2)).toBe(0);
			}
		});
	});

	describe("EIP Support Checks", () => {
		it("should check EIP-1559 support with hasEIP1559()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();

			if (london && berlin) {
				// EIP-1559 was introduced in London
				expect(Hardfork.hasEIP1559(london)).toBe(true);
				expect(Hardfork.hasEIP1559(berlin)).toBe(false);
			}
		});

		it("should check EIP-3855 (PUSH0) support with hasEIP3855()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const shanghai = Hardfork.fromString("shanghai");
			const london = Hardfork.fromString("london");

			expect(shanghai).toBeDefined();
			expect(london).toBeDefined();

			if (shanghai && london) {
				// EIP-3855 (PUSH0) was introduced in Shanghai
				expect(Hardfork.hasEIP3855(shanghai)).toBe(true);
				expect(Hardfork.hasEIP3855(london)).toBe(false);
			}
		});

		it("should check EIP-4844 (blob) support with hasEIP4844()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const cancun = Hardfork.fromString("cancun");
			const shanghai = Hardfork.fromString("shanghai");

			expect(cancun).toBeDefined();
			expect(shanghai).toBeDefined();

			if (cancun && shanghai) {
				// EIP-4844 (blobs) was introduced in Cancun
				expect(Hardfork.hasEIP4844(cancun)).toBe(true);
				expect(Hardfork.hasEIP4844(shanghai)).toBe(false);
			}
		});

		it("should check EIP-1153 (transient storage) support with hasEIP1153()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const cancun = Hardfork.fromString("cancun");
			const shanghai = Hardfork.fromString("shanghai");

			expect(cancun).toBeDefined();
			expect(shanghai).toBeDefined();

			if (cancun && shanghai) {
				// EIP-1153 (TSTORE/TLOAD) was introduced in Cancun
				expect(Hardfork.hasEIP1153(cancun)).toBe(true);
				expect(Hardfork.hasEIP1153(shanghai)).toBe(false);
			}
		});
	});

	describe("Alias Functions", () => {
		it("should have supportsEIP1559() alias", async () => {
			const { supportsEIP1559 } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);
			const { LONDON } = await import(
				"../../../src/primitives/Hardfork/constants.js"
			);

			// supportsEIP1559 is a method that uses `this` context
			expect(supportsEIP1559.call(LONDON)).toBe(true);
		});

		it("should have supportsPUSH0() alias", async () => {
			const { supportsPUSH0 } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);
			const { SHANGHAI } = await import(
				"../../../src/primitives/Hardfork/constants.js"
			);

			// supportsPUSH0 is a method that uses `this` context
			expect(supportsPUSH0.call(SHANGHAI)).toBe(true);
		});

		it("should have supportsBlobs() alias", async () => {
			const { supportsBlobs } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);
			const { CANCUN } = await import(
				"../../../src/primitives/Hardfork/constants.js"
			);

			// supportsBlobs is a method that uses `this` context
			expect(supportsBlobs.call(CANCUN)).toBe(true);
		});

		it("should have supportsTransientStorage() alias", async () => {
			const { supportsTransientStorage } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);
			const { CANCUN } = await import(
				"../../../src/primitives/Hardfork/constants.js"
			);

			// supportsTransientStorage is a method that uses `this` context
			expect(supportsTransientStorage.call(CANCUN)).toBe(true);
		});
	});

	describe("Merge/PoS Detection", () => {
		it("should detect post-merge forks with isPostMerge()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const merge = Hardfork.fromString("merge");
			const shanghai = Hardfork.fromString("shanghai");
			const london = Hardfork.fromString("london");

			expect(merge).toBeDefined();
			expect(shanghai).toBeDefined();
			expect(london).toBeDefined();

			if (merge && shanghai && london) {
				expect(Hardfork.isPostMerge(merge)).toBe(true);
				expect(Hardfork.isPostMerge(shanghai)).toBe(true);
				expect(Hardfork.isPostMerge(london)).toBe(false);
			}
		});

		it("should detect PoS with isPoS()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const shanghai = Hardfork.fromString("shanghai");
			expect(shanghai).toBeDefined();
			if (shanghai) {
				expect(Hardfork.isPoS(shanghai)).toBe(true);
			}
		});
	});

	describe("All Hardforks", () => {
		it("should get all hardfork names with allNames()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const names = Hardfork.allNames();
			expect(Array.isArray(names)).toBe(true);
			expect(names.length).toBeGreaterThan(0);
			expect(names).toContain("london");
			expect(names).toContain("berlin");
			expect(names).toContain("cancun");
		});

		it("should get all hardfork IDs with allIds()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const ids = Hardfork.allIds();
			expect(Array.isArray(ids)).toBe(true);
			expect(ids.length).toBeGreaterThan(0);
		});
	});

	describe("Range", () => {
		it("should get range of hardforks with range()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const berlin = Hardfork.fromString("berlin");
			const london = Hardfork.fromString("london");

			expect(berlin).toBeDefined();
			expect(london).toBeDefined();

			if (berlin && london) {
				const forkRange = Hardfork.range(berlin, london);
				expect(Array.isArray(forkRange)).toBe(true);
				expect(forkRange.length).toBeGreaterThan(0);
			}
		});
	});

	describe("Min/Max", () => {
		it("should get minimum hardfork with min()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && berlin && cancun) {
				const minFork = Hardfork.min([london, berlin, cancun]);
				expect(Hardfork.equals(minFork, berlin)).toBe(true);
			}
		});

		it("should get maximum hardfork with max()", async () => {
			const { Hardfork } = await import(
				"../../../src/primitives/Hardfork/index.js"
			);

			const london = Hardfork.fromString("london");
			const berlin = Hardfork.fromString("berlin");
			const cancun = Hardfork.fromString("cancun");

			expect(london).toBeDefined();
			expect(berlin).toBeDefined();
			expect(cancun).toBeDefined();

			if (london && berlin && cancun) {
				const maxFork = Hardfork.max([london, berlin, cancun]);
				expect(Hardfork.equals(maxFork, cancun)).toBe(true);
			}
		});
	});
});
