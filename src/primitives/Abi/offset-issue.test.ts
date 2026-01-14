/**
 * Tests for Issue #104: ABI.decodeParameters doesn't handle bytes/string offsets correctly
 *
 * This file tests decoding of dynamic types (bytes, string) with multiple parameters,
 * including nested dynamic types and mixed static/dynamic parameters.
 */

import { describe, expect, it } from "vitest";
import * as Hex from "../Hex/index.js";
import * as Abi from "./index.js";
import type { ParametersToPrimitiveTypes } from "./Parameter.js";

describe("Issue #104: ABI offset handling for dynamic types", () => {
	// Test 1: Multiple bytes parameters
	it("decodes multiple bytes parameters correctly", () => {
		const params = [
			{ type: "bytes" },
			{ type: "bytes" },
			{ type: "bytes" },
		] as const;
		const values = ["0x1234", "0x5678", "0x9abcdef0"];

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			values[0].toLowerCase(),
		);
		expect(Hex.fromBytes(decoded[1] as Uint8Array).toLowerCase()).toBe(
			values[1].toLowerCase(),
		);
		expect(Hex.fromBytes(decoded[2] as Uint8Array).toLowerCase()).toBe(
			values[2].toLowerCase(),
		);
	});

	// Test 2: Multiple string parameters
	it("decodes multiple string parameters correctly", () => {
		const params = [
			{ type: "string" },
			{ type: "string" },
			{ type: "string" },
		] as const;
		const values = ["hello", "world", "foo bar baz"];

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(decoded[0]).toBe(values[0]);
		expect(decoded[1]).toBe(values[1]);
		expect(decoded[2]).toBe(values[2]);
	});

	// Test 3: Mixed bytes and string
	it("decodes mixed bytes and string parameters", () => {
		const params = [
			{ type: "bytes" },
			{ type: "string" },
			{ type: "bytes" },
		] as const;
		const values = ["0x1234", "hello", "0x5678"];

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			values[0].toLowerCase(),
		);
		expect(decoded[1]).toBe(values[1]);
		expect(Hex.fromBytes(decoded[2] as Uint8Array).toLowerCase()).toBe(
			values[2].toLowerCase(),
		);
	});

	// Test 4: Static and dynamic mixed
	it("decodes static types between dynamic types", () => {
		const params = [
			{ type: "uint256" },
			{ type: "bytes" },
			{ type: "address" },
			{ type: "string" },
			{ type: "bool" },
		] as const;
		const values = [
			42n,
			"0xdeadbeef",
			"0x0000000000000000000000000000000000000001",
			"test string",
			true,
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(decoded[0]).toBe(42n);
		expect(Hex.fromBytes(decoded[1] as Uint8Array).toLowerCase()).toBe(
			"0xdeadbeef",
		);
		expect(String(decoded[2]).toLowerCase()).toBe(values[2].toLowerCase());
		expect(decoded[3]).toBe("test string");
		expect(decoded[4]).toBe(true);
	});

	// Test 5: Long bytes/strings (multiple 32-byte slots)
	it("decodes long dynamic types correctly", () => {
		const params = [{ type: "bytes" }, { type: "string" }] as const;
		const longBytes = `0x${"ab".repeat(100)}`; // 100 bytes
		const longString = "a".repeat(100); // 100 character string

		const encoded = Abi.encodeParameters(params, [longBytes, longString]);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(Hex.fromBytes(decoded[0] as Uint8Array).toLowerCase()).toBe(
			longBytes.toLowerCase(),
		);
		expect(decoded[1]).toBe(longString);
	});

	// Test 6: Dynamic types in tuple
	it("decodes tuple with multiple dynamic types", () => {
		const params = [
			{
				type: "tuple",
				components: [
					{ type: "bytes" },
					{ type: "string" },
					{ type: "uint256" },
				],
			},
		] as const;
		const value = ["0x1234", "hello", 42n];
		const values = [value] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const tuple = decoded[0] as unknown[];
		expect(Hex.fromBytes(tuple[0] as Uint8Array).toLowerCase()).toBe("0x1234");
		expect(tuple[1]).toBe("hello");
		expect(tuple[2]).toBe(42n);
	});

	// Test 7: Dynamic arrays with dynamic elements
	it("decodes dynamic array of bytes", () => {
		const params = [{ type: "bytes[]" }] as const;
		const values = [
			["0x1234", "0x5678", "0xabcd"],
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const arr = decoded[0] as Uint8Array[];
		expect(arr.length).toBe(3);
		expect(Hex.fromBytes(arr[0]).toLowerCase()).toBe("0x1234");
		expect(Hex.fromBytes(arr[1]).toLowerCase()).toBe("0x5678");
		expect(Hex.fromBytes(arr[2]).toLowerCase()).toBe("0xabcd");
	});

	// Test 8: Dynamic array of strings
	it("decodes dynamic array of strings", () => {
		const params = [{ type: "string[]" }] as const;
		const values = [
			["hello", "world", "foo"],
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const arr = decoded[0] as string[];
		expect(arr.length).toBe(3);
		expect(arr[0]).toBe("hello");
		expect(arr[1]).toBe("world");
		expect(arr[2]).toBe("foo");
	});

	// Test 9: Multiple dynamic arrays
	it("decodes multiple dynamic arrays", () => {
		const params = [
			{ type: "uint256[]" },
			{ type: "string" },
			{ type: "bytes[]" },
		] as const;
		const values = [
			[1n, 2n, 3n],
			"separator",
			["0x11", "0x22"],
		] satisfies ParametersToPrimitiveTypes<typeof params>;

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(decoded[0]).toEqual([1n, 2n, 3n]);
		expect(decoded[1]).toBe("separator");
		const arr = decoded[2] as Uint8Array[];
		expect(Hex.fromBytes(arr[0]).toLowerCase()).toBe("0x11");
		expect(Hex.fromBytes(arr[1]).toLowerCase()).toBe("0x22");
	});

	// Test 10: Empty dynamic types
	it("decodes empty bytes and strings", () => {
		const params = [
			{ type: "bytes" },
			{ type: "string" },
			{ type: "bytes" },
		] as const;
		const values = ["0x", "", "0xdeadbeef"];

		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		expect(Hex.fromBytes(decoded[0] as Uint8Array)).toBe("0x");
		expect(decoded[1]).toBe("");
		expect(Hex.fromBytes(decoded[2] as Uint8Array).toLowerCase()).toBe(
			"0xdeadbeef",
		);
	});

	// Test 11: Complex nested structure
	it("decodes complex nested structures with dynamic types", () => {
		const params = [
			{
				type: "tuple",
				components: [
					{ type: "address" },
					{ type: "bytes" },
					{
						type: "tuple",
						components: [{ type: "string" }, { type: "uint256" }],
					},
				],
			},
		] as const;
		const value = [
			"0x0000000000000000000000000000000000000001",
			"0xcafe",
			["nested string", 999n],
		];

		const values = [value] satisfies ParametersToPrimitiveTypes<typeof params>;
		const encoded = Abi.encodeParameters(params, values);
		const decoded = Abi.decodeParameters(params, encoded);

		const tuple = decoded[0] as unknown[];
		expect(String(tuple[0]).toLowerCase()).toBe(value[0].toLowerCase());
		expect(Hex.fromBytes(tuple[1] as Uint8Array).toLowerCase()).toBe("0xcafe");
		const nested = tuple[2] as unknown[];
		expect(nested[0]).toBe("nested string");
		expect(nested[1]).toBe(999n);
	});
});
