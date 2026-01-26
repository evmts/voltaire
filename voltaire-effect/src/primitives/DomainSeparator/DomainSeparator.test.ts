import * as Schema from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as DomainSeparator from "./index.js";

describe("DomainSeparator.Hex", () => {
	describe("decode", () => {
		it("decodes valid hex string", () => {
			const hex = `0x${"ab".repeat(32)}`;
			const result = Schema.decodeSync(DomainSeparator.Hex)(hex);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("fails for wrong hex length", () => {
			const hex = `0x${"ab".repeat(16)}`;
			expect(() => Schema.decodeSync(DomainSeparator.Hex)(hex)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes back to hex", () => {
			const hex = `0x${"ab".repeat(32)}`;
			const decoded = Schema.decodeSync(DomainSeparator.Hex)(hex);
			const encoded = Schema.encodeSync(DomainSeparator.Hex)(decoded);
			expect(encoded).toBe(hex);
		});
	});
});

describe("DomainSeparator.Bytes", () => {
	describe("decode", () => {
		it("decodes 32-byte Uint8Array", () => {
			const bytes = new Uint8Array(32).fill(0xab);
			const result = Schema.decodeSync(DomainSeparator.Bytes)(bytes);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("fails for wrong byte length", () => {
			const bytes = new Uint8Array(16);
			expect(() => Schema.decodeSync(DomainSeparator.Bytes)(bytes)).toThrow();
		});
	});

	describe("encode", () => {
		it("encodes back to bytes", () => {
			const bytes = new Uint8Array(32).fill(0xab);
			const decoded = Schema.decodeSync(DomainSeparator.Bytes)(bytes);
			const encoded = Schema.encodeSync(DomainSeparator.Bytes)(decoded);
			expect(encoded).toEqual(bytes);
		});
	});
});

describe("pure functions", () => {
	it("equals returns true for equal separators", () => {
		const a = Schema.decodeSync(DomainSeparator.Hex)(`0x${"ab".repeat(32)}`);
		const b = Schema.decodeSync(DomainSeparator.Hex)(`0x${"ab".repeat(32)}`);
		expect(DomainSeparator.equals(a, b)).toBe(true);
	});

	it("equals returns false for different separators", () => {
		const a = Schema.decodeSync(DomainSeparator.Hex)(`0x${"ab".repeat(32)}`);
		const b = Schema.decodeSync(DomainSeparator.Hex)(`0x${"cd".repeat(32)}`);
		expect(DomainSeparator.equals(a, b)).toBe(false);
	});
});
