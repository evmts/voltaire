import { describe, expect, it } from "vitest";
import { StorageKeySchema } from "./effect.js";

describe("StorageKey Effect Schema", () => {
	it("constructs and compares", () => {
		const addr = new Uint8Array(20);
		const k1 = new StorageKeySchema({ address: addr, slot: 1n });
		const k2 = StorageKeySchema.from({ address: addr, slot: 1n });
		expect(k1.equals(k2)).toBe(true);
		expect(typeof k1.toString()).toBe("string");
		expect(typeof k1.hashCode()).toBe("number");
	});
});
