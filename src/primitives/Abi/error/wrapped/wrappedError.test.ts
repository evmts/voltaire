import { describe, expect, it } from "vitest";
import { Address } from "../../../Address/index.js";
import { fromBytes, toBytes } from "../../../Hex/index.js";
import * as Selector from "../../../Selector/index.js";
import { WRAPPED_ERROR_SELECTOR } from "./constants.js";
import { decodeWrappedError } from "./decodeWrappedError.js";
import { encodeWrappedError } from "./encodeWrappedError.js";

// Helper to create Bytes from hex
function bytesFromHex(hex) {
	return toBytes(hex);
}

describe("ERC-7751 WrappedError", () => {
	describe("constants", () => {
		it("should have correct WrappedError selector", () => {
			// error WrappedError(address,bytes4,bytes,bytes)
			const expected = Selector.fromSignature(
				"WrappedError(address,bytes4,bytes,bytes)",
			);
			expect(Selector.toHex(WRAPPED_ERROR_SELECTOR)).toBe(
				Selector.toHex(expected),
			);
		});
	});

	describe("encodeWrappedError", () => {
		it("should encode wrapped error with all fields", () => {
			const wrapped = {
				target: Address.from("0x1234567890123456789012345678901234567890"),
				selector: Selector.fromHex("0xabcd1234"),
				reason: bytesFromHex("0x08c379a0"), // Error(string) selector
				details: bytesFromHex("0x1234"),
			};

			const encoded = encodeWrappedError(wrapped);

			// Should start with WrappedError selector
			expect(encoded.length).toBeGreaterThan(4);
			expect(Selector.toHex(encoded.slice(0, 4))).toBe(
				Selector.toHex(WRAPPED_ERROR_SELECTOR),
			);
		});

		it("should encode wrapped error with empty bytes", () => {
			const wrapped = {
				target: Address.from("0x1234567890123456789012345678901234567890"),
				selector: Selector.fromHex("0xabcd1234"),
				reason: bytesFromHex("0x"),
				details: bytesFromHex("0x"),
			};

			const encoded = encodeWrappedError(wrapped);
			expect(encoded.length).toBeGreaterThan(4);
		});
	});

	describe("decodeWrappedError", () => {
		it("should decode wrapped error correctly", () => {
			const original = {
				target: Address.from("0x1234567890123456789012345678901234567890"),
				selector: Selector.fromHex("0xabcd1234"),
				reason: bytesFromHex("0x08c379a0"),
				details: bytesFromHex("0x1234"),
			};

			const encoded = encodeWrappedError(original);
			const decoded = decodeWrappedError(encoded);

			expect(decoded.target.toHex()).toBe(original.target.toHex());
			expect(Selector.toHex(decoded.selector)).toBe(
				Selector.toHex(original.selector),
			);
			expect(fromBytes(decoded.reason)).toBe(fromBytes(original.reason));
			expect(fromBytes(decoded.details)).toBe(fromBytes(original.details));
		});

		it("should decode wrapped error with empty bytes", () => {
			const original = {
				target: Address.from("0x0000000000000000000000000000000000000000"),
				selector: Selector.fromHex("0x00000000"),
				reason: bytesFromHex("0x"),
				details: bytesFromHex("0x"),
			};

			const encoded = encodeWrappedError(original);
			const decoded = decodeWrappedError(encoded);

			expect(decoded.target.toHex()).toBe(original.target.toHex());
			expect(Selector.toHex(decoded.selector)).toBe(
				Selector.toHex(original.selector),
			);
			expect(decoded.reason.length).toBe(0);
			expect(decoded.details.length).toBe(0);
		});

		it("should throw on invalid selector", () => {
			const badData = new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x00]);
			expect(() => decodeWrappedError(badData)).toThrow(
				"Invalid WrappedError selector",
			);
		});

		it("should throw on data too short", () => {
			const badData = new Uint8Array([0x12, 0x34]);
			expect(() => decodeWrappedError(badData)).toThrow("Data too short");
		});
	});

	describe("round-trip encoding", () => {
		it("should encode and decode successfully", () => {
			const original = {
				target: Address.from("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef"),
				selector: Selector.fromSignature("transfer(address,uint256)"),
				reason: bytesFromHex(
					"0x08c379a00000000000000000000000000000000000000000000000000000000000000020",
				),
				details: bytesFromHex("0xabcdef1234567890"),
			};

			const encoded = encodeWrappedError(original);
			const decoded = decodeWrappedError(encoded);

			expect(decoded.target.toHex()).toBe(original.target.toHex());
			expect(Selector.toHex(decoded.selector)).toBe(
				Selector.toHex(original.selector),
			);
			expect(fromBytes(decoded.reason)).toBe(fromBytes(original.reason));
			expect(fromBytes(decoded.details)).toBe(fromBytes(original.details));
		});

		it("should handle large reason data", () => {
			const largeReason = new Uint8Array(1024).fill(0xff);
			const original = {
				target: Address.from("0x1111111111111111111111111111111111111111"),
				selector: Selector.fromHex("0x12345678"),
				reason: largeReason,
				details: bytesFromHex("0x"),
			};

			const encoded = encodeWrappedError(original);
			const decoded = decodeWrappedError(encoded);

			expect(decoded.reason.length).toBe(1024);
			expect(decoded.reason).toEqual(largeReason);
		});
	});
});
