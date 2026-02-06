import { describe, expect, it } from "vitest";
import * as DecodedData from "./index.js";

describe("DecodedData", () => {
	describe("from", () => {
		it("creates DecodedData from values and types", () => {
			const data = DecodedData.from({ amount: 100n, recipient: "0x1234" }, [
				"uint256",
				"address",
			]);

			expect(data.values).toEqual({ amount: 100n, recipient: "0x1234" });
			expect(data.types).toEqual(["uint256", "address"]);
		});

		it("handles single value", () => {
			const data = DecodedData.from(42n, ["uint256"]);

			expect(data.values).toBe(42n);
			expect(data.types).toEqual(["uint256"]);
		});

		it("handles array values", () => {
			const data = DecodedData.from([1n, 2n, 3n], ["uint256[]"]);

			expect(data.values).toEqual([1n, 2n, 3n]);
			expect(data.types).toEqual(["uint256[]"]);
		});

		it("handles tuple values", () => {
			const data = DecodedData.from({ x: 1n, y: 2n }, [
				"tuple(uint256,uint256)",
			]);

			expect(data.values).toEqual({ x: 1n, y: 2n });
			expect(data.types).toEqual(["tuple(uint256,uint256)"]);
		});

		it("handles complex nested types", () => {
			const values = {
				user: "0x1234",
				balances: [100n, 200n],
				metadata: { name: "Test", value: 42n },
			};
			const types = ["address", "uint256[]", "tuple(string,uint256)"];

			const data = DecodedData.from(values, types);

			expect(data.values).toEqual(values);
			expect(data.types).toEqual(types);
		});

		it("handles empty types", () => {
			const data = DecodedData.from(undefined, []);

			expect(data.values).toBeUndefined();
			expect(data.types).toEqual([]);
		});

		it("preserves type information", () => {
			type MyValues = { a: bigint; b: string };
			const data = DecodedData.from<MyValues>({ a: 123n, b: "test" }, [
				"uint256",
				"string",
			]);

			// TypeScript should infer the correct type
			const values: MyValues = data.values;
			expect(values.a).toBe(123n);
			expect(values.b).toBe("test");
		});

		it("types are readonly", () => {
			const types = ["uint256", "address"];
			const data = DecodedData.from({ a: 1n, b: "0x" }, types);

			// This should be readonly (TypeScript compile-time check)
			expect(Object.isFrozen(data)).toBe(false); // Object itself not frozen
			expect(data.types).toBe(types); // Same reference
		});

		it("handles null values", () => {
			const data = DecodedData.from(null, ["address"]);

			expect(data.values).toBeNull();
			expect(data.types).toEqual(["address"]);
		});

		it("handles boolean values", () => {
			const data = DecodedData.from([true, false, true], ["bool[]"]);

			expect(data.values).toEqual([true, false, true]);
			expect(data.types).toEqual(["bool[]"]);
		});

		it("handles string values", () => {
			const data = DecodedData.from("Hello, world!", ["string"]);

			expect(data.values).toBe("Hello, world!");
			expect(data.types).toEqual(["string"]);
		});

		it("handles bytes values", () => {
			const bytes = new Uint8Array([1, 2, 3, 4]);
			const data = DecodedData.from(bytes, ["bytes"]);

			expect(data.values).toBe(bytes);
			expect(data.types).toEqual(["bytes"]);
		});

		it("handles fixed bytes values", () => {
			const data = DecodedData.from("0x1234567890abcdef", ["bytes8"]);

			expect(data.values).toBe("0x1234567890abcdef");
			expect(data.types).toEqual(["bytes8"]);
		});

		it("handles multiple return values", () => {
			const data = DecodedData.from(
				[100n, "0x1234", true],
				["uint256", "address", "bool"],
			);

			expect(data.values).toEqual([100n, "0x1234", true]);
			expect(data.types).toEqual(["uint256", "address", "bool"]);
		});

		it("preserves object structure", () => {
			const values = {
				nested: {
					deep: {
						value: 42n,
					},
				},
			};
			const data = DecodedData.from(values, ["tuple"]);

			expect(data.values).toEqual(values);
			expect(data.values).toBe(values); // Same reference
		});
	});

	describe("type inference", () => {
		it("infers generic type correctly", () => {
			const data = DecodedData.from({ a: 1n }, ["uint256"]);
			// TypeScript should infer T = { a: bigint }
			const a: bigint = data.values.a;
			expect(a).toBe(1n);
		});

		it("allows explicit type parameter", () => {
			interface MyType {
				amount: bigint;
				recipient: string;
			}

			const data = DecodedData.from<MyType>(
				{ amount: 100n, recipient: "0x1234" },
				["uint256", "address"],
			);

			const amount: bigint = data.values.amount;
			const recipient: string = data.values.recipient;

			expect(amount).toBe(100n);
			expect(recipient).toBe("0x1234");
		});
	});

	describe("immutability", () => {
		it("creates immutable structure", () => {
			const data = DecodedData.from({ a: 1n }, ["uint256"]);

			// TypeScript enforces readonly at compile time
			// Runtime assignment will succeed but TypeScript prevents it
			// This is by design - readonly is a compile-time feature
			expect(data.values).toEqual({ a: 1n });
			expect(data.types).toEqual(["uint256"]);
		});
	});
});
