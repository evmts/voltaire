import { describe, expect, it } from "vitest";
import { decodePath, encodePath } from "./encodePath.js";

describe("encodePath", () => {
	it("encodes even extension path", () => {
		// nibbles [0, 1, 2, 3] extension → prefix 0x00 then 0x01 0x23
		const result = encodePath(new Uint8Array([0, 1, 2, 3]), false);
		expect(result).toEqual(new Uint8Array([0x00, 0x01, 0x23]));
	});

	it("encodes odd extension path", () => {
		// nibbles [1, 2, 3] extension → prefix 0x11 then 0x23
		const result = encodePath(new Uint8Array([1, 2, 3]), false);
		expect(result).toEqual(new Uint8Array([0x11, 0x23]));
	});

	it("encodes even leaf path", () => {
		// nibbles [0, 1, 2, 3] leaf → prefix 0x20 then 0x01 0x23
		const result = encodePath(new Uint8Array([0, 1, 2, 3]), true);
		expect(result).toEqual(new Uint8Array([0x20, 0x01, 0x23]));
	});

	it("encodes odd leaf path", () => {
		// nibbles [5] leaf → prefix 0x35
		const result = encodePath(new Uint8Array([5]), true);
		expect(result).toEqual(new Uint8Array([0x35]));
	});

	it("encodes empty even extension", () => {
		const result = encodePath(new Uint8Array([]), false);
		expect(result).toEqual(new Uint8Array([0x00]));
	});

	it("encodes empty even leaf", () => {
		const result = encodePath(new Uint8Array([]), true);
		expect(result).toEqual(new Uint8Array([0x20]));
	});
});

describe("decodePath", () => {
	it("round-trips even extension", () => {
		const nibbles = new Uint8Array([0, 1, 2, 3]);
		const encoded = encodePath(nibbles, false);
		const decoded = decodePath(encoded);
		expect(decoded.nibbles).toEqual(nibbles);
		expect(decoded.isLeaf).toBe(false);
	});

	it("round-trips odd leaf", () => {
		const nibbles = new Uint8Array([5, 6, 7]);
		const encoded = encodePath(nibbles, true);
		const decoded = decodePath(encoded);
		expect(decoded.nibbles).toEqual(nibbles);
		expect(decoded.isLeaf).toBe(true);
	});

	it("round-trips single nibble extension", () => {
		const nibbles = new Uint8Array([0x0a]);
		const encoded = encodePath(nibbles, false);
		const decoded = decodePath(encoded);
		expect(decoded.nibbles).toEqual(nibbles);
		expect(decoded.isLeaf).toBe(false);
	});

	it("round-trips empty leaf", () => {
		const nibbles = new Uint8Array([]);
		const encoded = encodePath(nibbles, true);
		const decoded = decodePath(encoded);
		expect(decoded.nibbles).toEqual(nibbles);
		expect(decoded.isLeaf).toBe(true);
	});
});
