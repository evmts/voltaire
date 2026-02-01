/**
 * Unit tests for Constructor factory function
 */

import { describe, expect, it } from "vitest";
import { Constructor } from "./Constructor.js";

describe("Constructor", () => {
	describe("factory function", () => {
		it("creates constructor instance", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(ctor.type).toBe("constructor");
			expect(ctor.stateMutability).toBe("nonpayable");
			expect(ctor.inputs).toEqual([]);
		});

		it("creates constructor with inputs", () => {
			const inputs = [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
			] as const;
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs,
			});

			expect(ctor.inputs).toEqual(inputs);
		});

		it("creates payable constructor", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [],
			});

			expect(ctor.stateMutability).toBe("payable");
		});

		it("defaults type to constructor", () => {
			const ctor = Constructor({
				stateMutability: "nonpayable",
				inputs: [],
				// biome-ignore lint/suspicious/noExplicitAny: Testing behavior when type field is missing
			} as any);

			expect(ctor.type).toBe("constructor");
		});

		it("sets up prototype chain", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(Object.getPrototypeOf(ctor)).toBe(Constructor.prototype);
		});
	});

	describe("static methods", () => {
		it("has encodeParams static method", () => {
			expect(typeof Constructor.encodeParams).toBe("function");
		});

		it("has decodeParams static method", () => {
			expect(typeof Constructor.decodeParams).toBe("function");
		});
	});

	describe("instance methods", () => {
		it("has encodeParams instance method", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			});

			expect(typeof ctor.encodeParams).toBe("function");
		});

		it("encodeParams encodes constructor arguments", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			});

			const encoded = ctor.encodeParams([1000n]);
			expect(encoded).toBeInstanceOf(Uint8Array);
			expect(encoded.length).toBe(32);
		});

		it("has decodeParams instance method", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			});

			expect(typeof ctor.decodeParams).toBe("function");
		});

		it("decodeParams decodes constructor data", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			});

			const encoded = ctor.encodeParams([1000n]);
			const decoded = ctor.decodeParams(encoded);

			expect(decoded).toEqual([1000n]);
		});

		it("round-trips encoding and decoding", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
					{ type: "uint8", name: "decimals" },
				],
			});

			// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for test args
			const args = ["MyToken", "MTK", 18n] as any;
			const encoded = ctor.encodeParams(args);
			const decoded = ctor.decodeParams(encoded);

			expect(decoded).toEqual(args);
		});
	});

	describe("toString and inspect", () => {
		it("has toString method", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "x" }],
			});

			expect(typeof ctor.toString).toBe("function");
			expect(ctor.toString()).toBe(
				"Constructor(stateMutability: nonpayable, inputs: 1)",
			);
		});

		it("formats with multiple inputs", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
				],
			});

			expect(ctor.toString()).toBe(
				"Constructor(stateMutability: payable, inputs: 2)",
			);
		});

		it("formats with no inputs", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(ctor.toString()).toBe(
				"Constructor(stateMutability: nonpayable, inputs: 0)",
			);
		});

		it("has custom inspect method", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
			expect(typeof ctor[inspectSymbol]).toBe("function");
		});

		it("custom inspect formats correctly", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [{ type: "uint256" }],
			});

			const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
			const result = ctor[inspectSymbol]();

			expect(result).toBe("Constructor(stateMutability: payable, inputs: 1)");
		});
	});

	describe("edge cases", () => {
		it("handles constructor with complex tuple input", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{
						type: "tuple",
						name: "config",
						components: [
							{ type: "address", name: "owner" },
							{ type: "uint256", name: "fee" },
						],
					},
				],
			});

			expect(ctor.inputs[0].type).toBe("tuple");
		});

		it("handles constructor with array input", () => {
			const ctor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "address[]", name: "admins" }],
			});

			expect(ctor.inputs[0].type).toBe("address[]");
		});
	});
});
