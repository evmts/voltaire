import { describe, expect, it } from "vitest";
import { BlobSchema } from "./effect.js";

describe("Blob Effect Schema", () => {
	it("constructs from data and converts back", () => {
		const data = new Uint8Array(100);
		const blob = BlobSchema.fromData(data);
		expect(blob.toData()).toBeInstanceOf(Uint8Array);
	});

	it("estimate and gas helpers", () => {
		expect(BlobSchema.estimateBlobCount(0)).toBe(0);
		expect(BlobSchema.calculateGas(1)).toBeGreaterThan(0);
	});
});
