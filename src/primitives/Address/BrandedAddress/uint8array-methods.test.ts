import { describe, expect, it } from "vitest";
import { Address } from "../index.js";

describe("Uint8Array integration", () => {
	describe("array operations", () => {
		describe("slice", () => {
			it("slices address bytes", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sliced = addr.slice(0, 4);
				expect(sliced).toBeInstanceOf(Uint8Array);
				expect(sliced.length).toBe(4);
				expect(sliced[0]).toBe(0x74);
				expect(sliced[3]).toBe(0xcc);
			});

			it("slices from middle", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sliced = addr.slice(10, 15);
				expect(sliced.length).toBe(5);
			});

			it("slices to end", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sliced = addr.slice(15);
				expect(sliced.length).toBe(5);
				expect(sliced[4]).toBe(0xe3);
			});

			it("handles negative indices", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sliced = addr.slice(-5);
				expect(sliced.length).toBe(5);
			});
		});

		describe("subarray", () => {
			it("creates subarray view", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sub = addr.subarray(0, 10);
				expect(sub).toBeInstanceOf(Uint8Array);
				expect(sub.length).toBe(10);
			});

			it("subarray shares buffer", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const sub = addr.subarray(0, 5);
				sub[0] = 0xff;
				expect(addr[0]).toBe(0xff);
			});
		});

		describe("map", () => {
			it("maps over bytes", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const mapped = Array.from(addr).map((b) => b * 2);
				expect(mapped[0]).toBe(2);
				expect(mapped.every((b) => b === 2)).toBe(true);
			});

			it("maps with index", () => {
				const addr = Address.fromHex(
					"0x0000000000000000000000000000000000000000",
				);
				const mapped = Array.from(addr).map((b, i) => i);
				expect(mapped[0]).toBe(0);
				expect(mapped[19]).toBe(19);
			});
		});

		describe("filter", () => {
			it("filters bytes", () => {
				const addr = Address.fromHex(
					"0x00010203040506070809ff0a0b0c0d0e0f101112",
				);
				const filtered = Array.from(addr).filter((b) => b > 0x10);
				expect(filtered.length).toBeGreaterThan(0);
				expect(filtered.every((b) => b > 0x10)).toBe(true);
			});

			it("filters with predicate", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const filtered = Array.from(addr).filter((b) => b < 0x50);
				expect(filtered.length).toBeGreaterThan(0);
			});
		});

		describe("reduce", () => {
			it("reduces bytes", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const sum = Array.from(addr).reduce((acc, b) => acc + b, 0);
				expect(sum).toBe(20);
			});

			it("reduces to max", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const max = Array.from(addr).reduce((max, b) => Math.max(max, b), 0);
				expect(max).toBeGreaterThan(0);
			});
		});
	});

	describe("iteration", () => {
		describe("forEach", () => {
			it("iterates over bytes", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				let count = 0;
				addr.forEach(() => {
					count++;
				});
				expect(count).toBe(20);
			});

			it("provides byte and index", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const bytes: number[] = [];
				const indices: number[] = [];
				addr.forEach((b, i) => {
					bytes.push(b);
					indices.push(i);
				});
				expect(bytes.length).toBe(20);
				expect(indices.length).toBe(20);
				expect(indices[0]).toBe(0);
				expect(indices[19]).toBe(19);
			});
		});

		describe("entries", () => {
			it("returns entries iterator", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const entries = Array.from(addr.entries());
				expect(entries.length).toBe(20);
				expect(entries[0][0]).toBe(0);
				expect(entries[0][1]).toBe(0x74);
			});
		});

		describe("keys", () => {
			it("returns keys iterator", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const keys = Array.from(addr.keys());
				expect(keys).toEqual([
					0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
				]);
			});
		});

		describe("values", () => {
			it("returns values iterator", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const values = Array.from(addr.values());
				expect(values.length).toBe(20);
				expect(values.every((v) => v === 1)).toBe(true);
			});
		});

		describe("for...of", () => {
			it("iterates with for...of", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const bytes: number[] = [];
				for (const byte of addr) {
					bytes.push(byte);
				}
				expect(bytes.length).toBe(20);
				expect(bytes[0]).toBe(0x74);
			});
		});
	});

	describe("search", () => {
		describe("find", () => {
			it("finds first matching byte", () => {
				const addr = Address.fromHex(
					"0x00010203040506070809ff0a0b0c0d0e0f101112",
				);
				const found = addr.find((b) => b === 0xff);
				expect(found).toBe(0xff);
			});

			it("returns undefined if not found", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const found = addr.find((b) => b === 0xff);
				expect(found).toBeUndefined();
			});
		});

		describe("findIndex", () => {
			it("finds index of first match", () => {
				const addr = Address.fromHex(
					"0x00010203040506070809ff0a0b0c0d0e0f101112",
				);
				const index = addr.findIndex((b) => b === 0xff);
				expect(index).toBe(10);
			});

			it("returns -1 if not found", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const index = addr.findIndex((b) => b === 0xff);
				expect(index).toBe(-1);
			});
		});

		describe("findLast", () => {
			it("finds last matching byte", () => {
				const addr = Address.fromHex(
					"0xff01020304050607080900ff0b0c0d0e0f101112",
				);
				const found = addr.findLast((b) => b === 0xff);
				expect(found).toBe(0xff);
			});

			it("returns undefined if not found", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const found = addr.findLast((b) => b === 0xfe);
				expect(found).toBeUndefined();
			});
		});

		describe("findLastIndex", () => {
			it("finds index of last match", () => {
				const addr = Address.fromHex(
					"0xff01020304050607080900ff0b0c0d0e0f101112",
				);
				const index = addr.findLastIndex((b) => b === 0xff);
				expect(index).toBe(11);
			});

			it("returns -1 if not found", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				const index = addr.findLastIndex((b) => b === 0xff);
				expect(index).toBe(-1);
			});
		});

		describe("indexOf", () => {
			it("finds index of value", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const index = addr.indexOf(0x74);
				expect(index).toBe(0);
			});

			it("finds from start index", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const index = addr.indexOf(0xcc, 1);
				expect(index).toBeGreaterThan(0);
			});

			it("returns -1 if not found", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const index = addr.indexOf(0x00);
				expect(index).toBe(-1);
			});
		});

		describe("lastIndexOf", () => {
			it("finds last index of value", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const index = addr.lastIndexOf(0x74);
				expect(index).toBeGreaterThanOrEqual(0);
			});

			it("returns -1 if not found", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const index = addr.lastIndexOf(0x00);
				expect(index).toBe(-1);
			});
		});

		describe("includes", () => {
			it("checks if byte exists", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.includes(0x74)).toBe(true);
			});

			it("returns false if not found", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.includes(0x00)).toBe(false);
			});

			it("checks from start index", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.includes(0x74, 1)).toBe(false);
			});
		});
	});

	describe("comparison", () => {
		describe("every", () => {
			it("checks if all bytes match predicate", () => {
				const addr = Address.fromHex(
					"0xffffffffffffffffffffffffffffffffffffffff",
				);
				expect(addr.every((b) => b === 0xff)).toBe(true);
			});

			it("returns false if any byte fails", () => {
				const addr = Address.fromHex(
					"0xff01010101010101010101010101010101010101",
				);
				expect(addr.every((b) => b === 0xff)).toBe(false);
			});
		});

		describe("some", () => {
			it("checks if any byte matches predicate", () => {
				const addr = Address.fromHex(
					"0xff01010101010101010101010101010101010101",
				);
				expect(addr.some((b) => b === 0xff)).toBe(true);
			});

			it("returns false if no bytes match", () => {
				const addr = Address.fromHex(
					"0x0101010101010101010101010101010101010101",
				);
				expect(addr.some((b) => b === 0xff)).toBe(false);
			});
		});
	});

	describe("manipulation", () => {
		describe("fill", () => {
			it("fills with value", () => {
				const addr = Address.zero();
				addr.fill(0xff);
				expect(addr.every((b) => b === 0xff)).toBe(true);
			});

			it("fills with range", () => {
				const addr = Address.zero();
				addr.fill(0xff, 0, 5);
				expect(addr[0]).toBe(0xff);
				expect(addr[4]).toBe(0xff);
				expect(addr[5]).toBe(0);
			});

			it("fills to end", () => {
				const addr = Address.zero();
				addr.fill(0xff, 15);
				expect(addr[14]).toBe(0);
				expect(addr[15]).toBe(0xff);
				expect(addr[19]).toBe(0xff);
			});
		});

		describe("set", () => {
			it("sets bytes from array", () => {
				const addr = Address.zero();
				addr.set([0xff, 0xfe, 0xfd], 0);
				expect(addr[0]).toBe(0xff);
				expect(addr[1]).toBe(0xfe);
				expect(addr[2]).toBe(0xfd);
			});

			it("sets at offset", () => {
				const addr = Address.zero();
				addr.set([0xff, 0xfe], 10);
				expect(addr[9]).toBe(0);
				expect(addr[10]).toBe(0xff);
				expect(addr[11]).toBe(0xfe);
			});
		});

		describe("copyWithin", () => {
			it("copies bytes within array", () => {
				const addr = Address.fromHex(
					"0xffeeddcc00000000000000000000000000000000",
				);
				addr.copyWithin(4, 0, 4);
				expect(addr[4]).toBe(0xff);
				expect(addr[5]).toBe(0xee);
				expect(addr[6]).toBe(0xdd);
				expect(addr[7]).toBe(0xcc);
			});
		});
	});

	describe("sorting", () => {
		describe("sort", () => {
			it("sorts bytes in place", () => {
				const addr = Address.fromHex(
					"0x0f0e0d0c0b0a09080706050403020100ffeeddcc",
				);
				addr.sort();
				for (let i = 1; i < addr.length; i++) {
					expect(addr[i]).toBeGreaterThanOrEqual(addr[i - 1]);
				}
			});

			it("sorts with compare function", () => {
				const addr = Address.fromHex(
					"0x0f0e0d0c0b0a09080706050403020100ffeeddcc",
				);
				addr.sort((a, b) => b - a);
				for (let i = 1; i < addr.length; i++) {
					expect(addr[i]).toBeLessThanOrEqual(addr[i - 1]);
				}
			});
		});

		describe("reverse", () => {
			it("reverses bytes in place", () => {
				const addr = Address.fromHex(
					"0x000102030405060708090a0b0c0d0e0f10111213",
				);
				const first = addr[0];
				const last = addr[19];
				addr.reverse();
				expect(addr[0]).toBe(last);
				expect(addr[19]).toBe(first);
			});
		});

		describe("toReversed", () => {
			it("returns reversed copy", () => {
				const addr = Address.fromHex(
					"0x000102030405060708090a0b0c0d0e0f10111213",
				);
				const reversed = addr.toReversed();
				expect(reversed[0]).toBe(addr[19]);
				expect(reversed[19]).toBe(addr[0]);
				expect(addr[0]).toBe(0);
			});
		});

		describe("toSorted", () => {
			it("returns sorted copy", () => {
				const addr = Address.fromHex(
					"0x0f0e0d0c0b0a09080706050403020100ffeeddcc",
				);
				const sorted = addr.toSorted();
				for (let i = 1; i < sorted.length; i++) {
					expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
				}
				expect(addr[0]).toBe(0x0f);
			});
		});
	});

	describe("utility", () => {
		describe("at", () => {
			it("accesses byte at index", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.at(0)).toBe(0x74);
				expect(addr.at(19)).toBe(0xe3);
			});

			it("supports negative indices", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.at(-1)).toBe(0xe3);
				expect(addr.at(-20)).toBe(0x74);
			});

			it("returns undefined for out of bounds", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				expect(addr.at(20)).toBeUndefined();
				expect(addr.at(-21)).toBeUndefined();
			});
		});

		describe("with", () => {
			it("returns copy with updated value", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const updated = addr.with(0, 0xff);
				expect(updated[0]).toBe(0xff);
				expect(addr[0]).toBe(0x74);
			});

			it("supports negative indices", () => {
				const addr = Address.fromHex(
					"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				);
				const updated = addr.with(-1, 0xff);
				expect(updated[19]).toBe(0xff);
				expect(addr[19]).toBe(0xe3);
			});
		});

		describe("join", () => {
			it("joins bytes to string", () => {
				const addr = Address.fromHex(
					"0x010203040506070809000a0b0c0d0e0f10111213",
				);
				const joined = addr.join(",");
				expect(joined).toContain(",");
				expect(joined.split(",").length).toBe(20);
			});

			it("joins with empty separator", () => {
				const addr = Address.fromHex(
					"0x0a0b0c0d0e0f000000000000000000000000e3e4",
				);
				const joined = addr.join("");
				expect(joined.length).toBeGreaterThan(0);
			});
		});

		describe("toString", () => {
			it("converts to string", () => {
				const addr = Address.fromHex(
					"0x010203040506070809000a0b0c0d0e0f10111213",
				);
				const str = addr.toString();
				expect(typeof str).toBe("string");
				expect(str).toContain(",");
			});
		});
	});

	describe("property access", () => {
		it("accesses bytes by index", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
			expect(addr[19]).toBe(0xe3);
		});

		it("sets bytes by index", () => {
			const addr = Address.zero();
			addr[0] = 0xff;
			addr[19] = 0xee;
			expect(addr[0]).toBe(0xff);
			expect(addr[19]).toBe(0xee);
		});

		it("has length property", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			expect(addr.length).toBe(20);
		});
	});
});
