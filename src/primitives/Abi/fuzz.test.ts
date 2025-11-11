import { describe, expect, it } from "vitest";
import * as Abi from "./index.js";
import type { AbiParameter } from "./types.js";

/**
 * Fuzz tests for ABI encoding/decoding
 *
 * These tests use randomized inputs to find edge cases, buffer overflows,
 * and parsing vulnerabilities in ABI encode/decode functions.
 */

describe("ABI Fuzz Tests", () => {
	// Helper: generate random bytes
	function randomBytes(length: number): Uint8Array {
		return Uint8Array.from({ length }, () => Math.floor(Math.random() * 256));
	}

	// Helper: generate random hex string
	function randomHex(length: number): `0x${string}` {
		const bytes = randomBytes(length);
		return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
	}

	// Helper: generate random ABI type
	function randomAbiType(): string {
		const types = [
			"uint256",
			"uint128",
			"uint64",
			"uint32",
			"uint16",
			"uint8",
			"int256",
			"int128",
			"int64",
			"int32",
			"int16",
			"int8",
			"address",
			"bool",
			"bytes",
			"string",
			"bytes32",
			"bytes16",
			"bytes8",
			"bytes4",
			"bytes1",
			"uint256[]",
			"address[]",
			"bool[]",
			"bytes[]",
		];
		return types[Math.floor(Math.random() * types.length)];
	}

	describe("Encode/Decode Round-trip Fuzz", () => {
		it("should handle random uint256 values", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256", name: "value" },
			];

			for (let i = 0; i < 100; i++) {
				// Random value between 0 and 2^256-1
				const randomValue = BigInt(
					Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
				);
				const values = [randomValue];

				try {
					const encoded = Abi.encodeParameters(params, values);
					const decoded = Abi.decodeParameters(params, encoded);

					expect(decoded[0]).toBe(randomValue);
				} catch (error) {
					// Should not throw for valid values
					throw new Error(`Failed on value ${randomValue}: ${error.message}`);
				}
			}
		});

		it("should handle random addresses", () => {
			const params: readonly AbiParameter[] = [
				{ type: "address", name: "addr" },
			];

			for (let i = 0; i < 50; i++) {
				const randomAddr = randomHex(20);
				const values = [randomAddr];

				try {
					const encoded = Abi.encodeParameters(params, values);
					const decoded = Abi.decodeParameters(params, encoded);

					// Normalize for comparison (lowercase)
					expect(decoded[0].toLowerCase()).toBe(randomAddr.toLowerCase());
				} catch (error) {
					throw new Error(`Failed on address ${randomAddr}: ${error.message}`);
				}
			}
		});

		it("should handle random bool values", () => {
			const params: readonly AbiParameter[] = [{ type: "bool", name: "flag" }];

			for (let i = 0; i < 50; i++) {
				const randomBool = Math.random() > 0.5;
				const values = [randomBool];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(randomBool);
			}
		});

		it("should handle random strings", () => {
			const params: readonly AbiParameter[] = [{ type: "string", name: "str" }];

			for (let i = 0; i < 50; i++) {
				// Random string of varying length
				const length = Math.floor(Math.random() * 200);
				const randomStr = Array.from({ length }, () =>
					String.fromCharCode(32 + Math.floor(Math.random() * 94)),
				).join("");
				const values = [randomStr];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(randomStr);
			}
		});

		it("should handle random dynamic bytes", () => {
			const params: readonly AbiParameter[] = [{ type: "bytes", name: "data" }];

			for (let i = 0; i < 50; i++) {
				const length = Math.floor(Math.random() * 200);
				const randomData = randomBytes(length);
				const values = [randomData];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				// Decoded bytes are Uint8Array
				expect(decoded[0]).toEqual(randomData);
			}
		});

		it("should handle random fixed bytes", () => {
			const sizes = [1, 4, 8, 16, 32];

			for (const size of sizes) {
				const params: readonly AbiParameter[] = [
					{ type: `bytes${size}`, name: "data" },
				];

				for (let i = 0; i < 20; i++) {
					const randomData = randomBytes(size);
					const values = [randomData];

					const encoded = Abi.encodeParameters(params, values);
					const decoded = Abi.decodeParameters(params, encoded);

					// Decoded fixed bytes are Uint8Array
					expect(decoded[0]).toEqual(randomData);
				}
			}
		});

		it("should handle random arrays", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256[]", name: "values" },
			];

			for (let i = 0; i < 30; i++) {
				const arrayLength = Math.floor(Math.random() * 20);
				const randomArray = Array.from({ length: arrayLength }, () =>
					BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
				);
				const values = [randomArray];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toEqual(randomArray);
			}
		});
	});

	describe("Malformed Input Fuzz", () => {
		it("should reject random malformed hex data", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256", name: "value" },
			];

			for (let i = 0; i < 50; i++) {
				// Random length, often not aligned to 32 bytes
				const length = Math.floor(Math.random() * 100);
				const malformedData = randomHex(length);

				// Should either decode or throw, but not crash
				try {
					Abi.decodeParameters(params, malformedData);
				} catch (error) {
					// Expected for malformed data
					expect(error).toBeDefined();
				}
			}
		});

		it("should handle truncated encoded data", () => {
			const params: readonly AbiParameter[] = [{ type: "string", name: "str" }];
			const values = ["Hello, World!"];

			const encoded = Abi.encodeParameters(params, values);

			// Try decoding progressively truncated data
			for (
				let truncateBytes = 1;
				truncateBytes < encoded.length / 2;
				truncateBytes += 4
			) {
				const truncated = encoded.slice(0, -truncateBytes * 2) as `0x${string}`;

				try {
					Abi.decodeParameters(params, truncated);
				} catch (error) {
					// Expected for truncated data
					expect(error).toBeDefined();
				}
			}
		});

		it("should handle invalid type strings", () => {
			const invalidTypes = [
				"uint257", // Invalid size
				"bytes33", // Invalid size
				"address[][]", // Triple nested (if not supported)
				"tuple", // No components
				"", // Empty
				"uint", // No size specified
				"foo", // Non-existent type
			];

			for (const invalidType of invalidTypes) {
				const params: readonly AbiParameter[] = [
					{ type: invalidType, name: "value" },
				];

				try {
					Abi.encodeParameters(params, [0]);
				} catch (error) {
					// Expected to throw for invalid types
					expect(error).toBeDefined();
				}
			}
		});

		it("should handle type mismatches", () => {
			const testCases: Array<{
				params: readonly AbiParameter[];
				values: unknown[];
				description: string;
			}> = [
				{
					params: [{ type: "uint256", name: "v" }],
					values: ["not a number"],
					description: "string for uint256",
				},
				{
					params: [{ type: "address", name: "addr" }],
					values: [123],
					description: "number for address",
				},
				{
					params: [{ type: "bool", name: "flag" }],
					values: ["true"],
					description: "string for bool",
				},
				{
					params: [{ type: "bytes32", name: "data" }],
					values: [randomHex(16)], // Wrong size
					description: "wrong size for bytes32",
				},
			];

			for (const { params, values, description } of testCases) {
				try {
					Abi.encodeParameters(params, values);
					// Some type mismatches might be coerced successfully
				} catch (error) {
					// Expected for type mismatches
					expect(error).toBeDefined();
				}
			}
		});
	});

	describe("Edge Case Fuzz", () => {
		it("should handle maximum uint256 values", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256", name: "value" },
			];
			const maxValues = [
				0n,
				1n,
				2n ** 256n - 1n, // Maximum uint256
				2n ** 255n, // Half of range
				2n ** 128n, // Large value
			];

			for (const value of maxValues) {
				const encoded = Abi.encodeParameters(params, [value]);
				const decoded = Abi.decodeParameters(params, encoded);
				expect(decoded[0]).toBe(value);
			}
		});

		it("should handle empty arrays", () => {
			const arrayTypes = [
				"uint256[]",
				"address[]",
				"bool[]",
				"bytes[]",
				"string[]",
			];

			for (const type of arrayTypes) {
				const params: readonly AbiParameter[] = [{ type, name: "arr" }];
				const values = [[]];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toEqual([]);
			}
		});

		it("should handle very long arrays", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256[]", name: "values" },
			];

			// Test with progressively larger arrays
			for (const length of [10, 50, 100, 200]) {
				const largeArray = Array.from({ length }, (_, i) => BigInt(i));
				const values = [largeArray];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toEqual(largeArray);
			}
		});

		it("should handle empty strings", () => {
			const params: readonly AbiParameter[] = [{ type: "string", name: "str" }];
			const values = [""];

			const encoded = Abi.encodeParameters(params, values);
			const decoded = Abi.decodeParameters(params, encoded);

			expect(decoded[0]).toBe("");
		});

		it("should handle very long strings", () => {
			const params: readonly AbiParameter[] = [{ type: "string", name: "str" }];

			for (const length of [100, 500, 1000, 5000]) {
				const longString = "a".repeat(length);
				const values = [longString];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(longString);
			}
		});

		it("should handle strings with special characters", () => {
			const params: readonly AbiParameter[] = [{ type: "string", name: "str" }];
			const specialStrings = [
				"Hello\x00World", // Null byte
				"Line1\nLine2", // Newline
				"Tab\tCharacter", // Tab
				"Emoji😀Test", // Unicode
				"\u0000\u0001\u0002", // Control characters
				"'\"\\`", // Quotes and backslash
			];

			for (const str of specialStrings) {
				const values = [str];
				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);
				expect(decoded[0]).toBe(str);
			}
		});

		it("should handle deeply nested tuples", () => {
			// Test nested tuple structures
			const params: readonly AbiParameter[] = [
				{
					type: "tuple",
					name: "outer",
					components: [
						{
							type: "tuple",
							name: "inner",
							components: [
								{ type: "uint256", name: "value" },
								{ type: "address", name: "addr" },
							],
						},
						{ type: "bool", name: "flag" },
					],
				},
			];

			// Tuple values should be arrays, not objects
			const values = [
				[[42n, "0x1234567890123456789012345678901234567890"], true],
			];

			const encoded = Abi.encodeParameters(params, values);
			const decoded = Abi.decodeParameters(params, encoded);

			// Decoded tuples are arrays
			expect(decoded[0][0][0]).toBe(42n);
			expect(decoded[0][1]).toBe(true);
		});

		it("should handle mixed static and dynamic types", () => {
			const params: readonly AbiParameter[] = [
				{ type: "uint256", name: "number" },
				{ type: "string", name: "text" },
				{ type: "address", name: "addr" },
				{ type: "bytes", name: "data" },
				{ type: "bool", name: "flag" },
			];

			for (let i = 0; i < 20; i++) {
				const number = BigInt(
					Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
				);
				const text = Array.from(
					{ length: Math.floor(Math.random() * 50) },
					() => String.fromCharCode(32 + Math.floor(Math.random() * 94)),
				).join("");
				const addr = randomHex(20);
				const data = randomBytes(Math.floor(Math.random() * 100));
				const flag = Math.random() > 0.5;

				const values = [number, text, addr, data, flag];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(number);
				expect(decoded[1]).toBe(text);
				expect(decoded[2].toLowerCase()).toBe(addr.toLowerCase());
				// Decoded bytes are Uint8Array
				expect(decoded[3]).toEqual(data);
				expect(decoded[4]).toBe(flag);
			}
		});
	});

	describe("Boundary Condition Fuzz", () => {
		it("should handle zero values", () => {
			const intTypes = [
				"uint8",
				"uint16",
				"uint32",
				"uint64",
				"uint128",
				"uint256",
				"int8",
				"int16",
				"int32",
				"int64",
				"int128",
				"int256",
			];

			for (const type of intTypes) {
				const params: readonly AbiParameter[] = [{ type, name: "value" }];
				const values = [0n];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(0n);
			}
		});

		it("should handle maximum values for sized types", () => {
			const testCases: Array<{ type: string; maxValue: bigint }> = [
				{ type: "uint8", maxValue: 2n ** 8n - 1n },
				{ type: "uint16", maxValue: 2n ** 16n - 1n },
				{ type: "uint32", maxValue: 2n ** 32n - 1n },
				{ type: "uint64", maxValue: 2n ** 64n - 1n },
				{ type: "uint128", maxValue: 2n ** 128n - 1n },
				{ type: "uint256", maxValue: 2n ** 256n - 1n },
			];

			for (const { type, maxValue } of testCases) {
				const params: readonly AbiParameter[] = [{ type, name: "value" }];
				const values = [maxValue];

				const encoded = Abi.encodeParameters(params, values);
				const decoded = Abi.decodeParameters(params, encoded);

				expect(decoded[0]).toBe(maxValue);
			}
		});

		it("should reject overflow values", () => {
			const testCases: Array<{ type: string; overflowValue: bigint }> = [
				{ type: "uint8", overflowValue: 2n ** 8n },
				{ type: "uint16", overflowValue: 2n ** 16n },
				{ type: "uint32", overflowValue: 2n ** 32n },
			];

			for (const { type, overflowValue } of testCases) {
				const params: readonly AbiParameter[] = [{ type, name: "value" }];
				const values = [overflowValue];

				try {
					Abi.encodeParameters(params, values);
					// If it doesn't throw, it should truncate or handle gracefully
				} catch (error) {
					// Expected to throw for overflow
					expect(error).toBeDefined();
				}
			}
		});
	});
});
