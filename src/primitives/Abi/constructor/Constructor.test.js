import { describe, expect, it } from "vitest";
import { Constructor } from "./Constructor.js";

describe("Constructor", () => {
	describe("factory function", () => {
		it("creates Constructor from object", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "initialSupply" }],
			});

			expect(constructor.type).toBe("constructor");
			expect(constructor.stateMutability).toBe("nonpayable");
			expect(constructor.inputs.length).toBe(1);
		});

		it("creates Constructor with no parameters", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(constructor.type).toBe("constructor");
			expect(constructor.inputs.length).toBe(0);
		});

		it("creates payable Constructor", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [],
			});

			expect(constructor.stateMutability).toBe("payable");
		});

		it("creates Constructor with multiple parameters", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
					{ type: "uint256", name: "initialSupply" },
				],
			});

			expect(constructor.inputs.length).toBe(3);
		});

		it("defaults type to constructor", () => {
			const constructor = Constructor({
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(constructor.type).toBe("constructor");
		});
	});

	describe("prototype setup", () => {
		it("sets correct prototype", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(Object.getPrototypeOf(constructor)).toBe(Constructor.prototype);
			expect(Object.getPrototypeOf(Object.getPrototypeOf(constructor))).toBe(
				Object.prototype,
			);
		});
	});

	describe("static methods", () => {
		it("has encodeParams method", () => {
			expect(typeof Constructor.encodeParams).toBe("function");
		});

		it("has decodeParams method", () => {
			expect(typeof Constructor.decodeParams).toBe("function");
		});
	});

	describe("instance methods", () => {
		const testConstructor = Constructor({
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "uint256", name: "initialSupply" },
				{ type: "string", name: "name" },
			],
		});

		describe("encodeParams", () => {
			it("encodes constructor parameters", () => {
				const encoded = testConstructor.encodeParams([1000n, "Token"]);
				expect(encoded).toBeInstanceOf(Uint8Array);
				expect(encoded.length).toBeGreaterThan(0);
			});

			it("encodes with no parameters", () => {
				const constructor = Constructor({
					type: "constructor",
					stateMutability: "nonpayable",
					inputs: [],
				});
				const encoded = constructor.encodeParams([]);
				expect(encoded).toBeInstanceOf(Uint8Array);
			});

			it("encodes single parameter", () => {
				const constructor = Constructor({
					type: "constructor",
					stateMutability: "nonpayable",
					inputs: [{ type: "uint256", name: "value" }],
				});
				const encoded = constructor.encodeParams([42n]);
				expect(encoded).toBeInstanceOf(Uint8Array);
				expect(encoded.length).toBe(32);
			});
		});

		describe("decodeParams", () => {
			it("decodes constructor parameters", () => {
				const encoded = testConstructor.encodeParams([1000n, "Token"]);
				const decoded = testConstructor.decodeParams(encoded);
				expect(decoded).toEqual([1000n, "Token"]);
			});

			it("decodes with no parameters", () => {
				const constructor = Constructor({
					type: "constructor",
					stateMutability: "nonpayable",
					inputs: [],
				});
				const encoded = constructor.encodeParams([]);
				const decoded = constructor.decodeParams(encoded);
				expect(decoded).toEqual([]);
			});

			it("round-trips encoding and decoding", () => {
				const args = [500n, "MyToken"];
				const encoded = testConstructor.encodeParams(args);
				const decoded = testConstructor.decodeParams(encoded);
				expect(decoded).toEqual(args);
			});
		});
	});

	describe("toString", () => {
		it("returns string representation", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			});
			const str = constructor.toString();
			expect(str).toContain("Constructor");
			expect(str).toContain("nonpayable");
			expect(str).toContain("inputs: 1");
		});

		it("shows correct input count", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [{ type: "uint256" }, { type: "string" }],
			});
			const str = constructor.toString();
			expect(str).toContain("inputs: 2");
		});

		it("handles no inputs", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});
			const str = constructor.toString();
			expect(str).toContain("inputs: 0");
		});
	});

	describe("inspect", () => {
		it("provides custom inspect output", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			});
			const inspectSymbol = Symbol.for("nodejs.util.inspect.custom");
			const inspected = constructor[inspectSymbol]();
			expect(inspected).toContain("Constructor");
			expect(inspected).toContain("nonpayable");
			expect(inspected).toContain("inputs: 1");
		});
	});

	describe("real-world examples", () => {
		it("creates ERC20 constructor", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
					{ type: "uint8", name: "decimals" },
					{ type: "uint256", name: "initialSupply" },
				],
			});

			expect(constructor.inputs.length).toBe(4);
			expect(constructor.stateMutability).toBe("nonpayable");
		});

		it("encodes and decodes ERC20 constructor parameters", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "string", name: "name" },
					{ type: "string", name: "symbol" },
					{ type: "uint256", name: "initialSupply" },
				],
			});

			const args = ["MyToken", "MTK", 1000000n];
			const encoded = constructor.encodeParams(args);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual(args);
		});

		it("creates payable contract constructor", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "payable",
				inputs: [{ type: "address", name: "owner" }],
			});

			expect(constructor.stateMutability).toBe("payable");
			expect(constructor.inputs.length).toBe(1);
		});
	});

	describe("parameter types", () => {
		it("handles uint256 parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256", name: "value" }],
			});

			const encoded = constructor.encodeParams([42n]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([42n]);
		});

		it("handles address parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "address", name: "owner" }],
			});

			const addr = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const encoded = constructor.encodeParams([addr]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([addr]);
		});

		it("handles string parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "string", name: "name" }],
			});

			const encoded = constructor.encodeParams(["Test"]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual(["Test"]);
		});

		it("handles bool parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "bool", name: "flag" }],
			});

			const encoded = constructor.encodeParams([true]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([true]);
		});

		it("handles bytes parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "bytes", name: "data" }],
			});

			const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
			const encoded = constructor.encodeParams([data]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded[0]).toEqual(data);
		});

		it("handles array parameter", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256[]", name: "values" }],
			});

			const values = [1n, 2n, 3n];
			const encoded = constructor.encodeParams([values]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([values]);
		});
	});

	describe("edge cases", () => {
		it("handles empty inputs array", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [],
			});

			expect(constructor.inputs).toEqual([]);
			const encoded = constructor.encodeParams([]);
			expect(encoded.length).toBe(0);
		});

		it("handles many parameters", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: Array.from({ length: 10 }, (_, i) => ({
					type: "uint256",
					name: `param${i}`,
				})),
			});

			const args = Array.from({ length: 10 }, (_, i) => BigInt(i));
			const encoded = constructor.encodeParams(args);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual(args);
		});

		it("handles zero values", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			});

			const encoded = constructor.encodeParams([0n]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([0n]);
		});
	});

	describe("boundary values", () => {
		it("handles max uint256", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			});

			const maxUint256 =
				0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
			const encoded = constructor.encodeParams([maxUint256]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([maxUint256]);
		});

		it("handles zero address", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "address" }],
			});

			const zeroAddr = "0x0000000000000000000000000000000000000000";
			const encoded = constructor.encodeParams([zeroAddr]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([zeroAddr]);
		});

		it("handles empty string", () => {
			const constructor = Constructor({
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "string" }],
			});

			const encoded = constructor.encodeParams([""]);
			const decoded = constructor.decodeParams(encoded);
			expect(decoded).toEqual([""]);
		});
	});

	describe("static method usage", () => {
		it("encodeParams works as static method", () => {
			const constructorDef = {
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			};

			const encoded = Constructor.encodeParams(constructorDef, [42n]);
			expect(encoded).toBeInstanceOf(Uint8Array);
		});

		it("decodeParams works as static method", () => {
			const constructorDef = {
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "uint256" }],
			};

			const encoded = Constructor.encodeParams(constructorDef, [42n]);
			const decoded = Constructor.decodeParams(constructorDef, encoded);
			expect(decoded).toEqual([42n]);
		});
	});
});
