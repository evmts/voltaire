import { describe, expect, it } from "vitest";
import * as KeccakPure from "./Keccak256.js";
import * as KeccakNative from "./Keccak256.native.js";

/**
 * Parity tests: Pure TS vs Native implementations
 * Ensures both implementations produce identical results
 */

describe("Keccak256 implementation parity", () => {
	const testCases = [
		{
			name: "empty input",
			input: new Uint8Array([]),
			expected:
				"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
		},
		{
			name: "hello world",
			input: new TextEncoder().encode("hello world"),
			expected:
				"0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad",
		},
		{
			name: "0x1234",
			input: new Uint8Array([0x12, 0x34]),
			expected:
				"0x56570de287d73cd1cb6092bb8fdee6173974955fdef345ae579ee9f475ea7432",
		},
		{
			name: "ethereum",
			input: new TextEncoder().encode("ethereum"),
			expected:
				"0x541111248b45b7a8dc3f5579f630e74cb01456ea6ac067d3f4d793245a255155",
		},
	];

	describe("hash() parity", () => {
		for (const { name, input, expected } of testCases) {
			it(`pure TS: ${name}`, () => {
				const result = KeccakPure.hash(input);
				const hex = `0x${Array.from(result)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
				expect(hex).toBe(expected);
			});

			it.skip(`native: ${name}`, async () => {
				const result = await KeccakNative.hash(input);
				const hex = `0x${Array.from(result)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
				expect(hex).toBe(expected);
			});

			it.skip(`parity: ${name}`, async () => {
				const pureResult = KeccakPure.hash(input);
				const nativeResult = await KeccakNative.hash(input);

				expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));
			});
		}
	});

	describe("hashString() parity", () => {
		const stringTestCases = [
			{
				str: "",
				expected:
					"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
			},
			{
				str: "hello",
				expected:
					"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
			},
			{
				str: "Transfer(address,address,uint256)",
				expected:
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			},
		];

		for (const { str, expected } of stringTestCases) {
			it.skip(`parity: "${str}"`, async () => {
				const pureResult = KeccakPure.hashString(str);
				const nativeResult = await KeccakNative.hashString(str);

				expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));

				const hex = `0x${Array.from(nativeResult)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
				expect(hex).toBe(expected);
			});
		}
	});

	describe("selector() parity", () => {
		const selectorTests = [
			{ signature: "transfer(address,uint256)", expected: "0xa9059cbb" },
			{ signature: "balanceOf(address)", expected: "0x70a08231" },
			{ signature: "approve(address,uint256)", expected: "0x095ea7b3" },
		];

		for (const { signature, expected } of selectorTests) {
			it.skip(`parity: ${signature}`, async () => {
				const pureResult = KeccakPure.selector(signature);
				const nativeResult = await KeccakNative.selector(signature);

				expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));

				const hex = `0x${Array.from(nativeResult)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
				expect(hex).toBe(expected);
			});
		}
	});

	describe("topic() parity", () => {
		const topicTests = [
			{
				signature: "Transfer(address,address,uint256)",
				expected:
					"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			},
			{
				signature: "Approval(address,address,uint256)",
				expected:
					"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
			},
		];

		for (const { signature, expected } of topicTests) {
			it.skip(`parity: ${signature}`, async () => {
				const pureResult = KeccakPure.topic(signature);
				const nativeResult = await KeccakNative.topic(signature);

				expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));

				const hex = `0x${Array.from(nativeResult)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
				expect(hex).toBe(expected);
			});
		}
	});

	describe("large input parity", () => {
		it.skip("handles 1KB input", async () => {
			const largeInput = new Uint8Array(1024).fill(0x42);
			const pureResult = KeccakPure.hash(largeInput);
			const nativeResult = await KeccakNative.hash(largeInput);

			expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));
		});

		it.skip("handles 1MB input", async () => {
			const largeInput = new Uint8Array(1024 * 1024).fill(0x42);
			const pureResult = KeccakPure.hash(largeInput);
			const nativeResult = await KeccakNative.hash(largeInput);

			expect(Array.from(nativeResult)).toEqual(Array.from(pureResult));
		});
	});
});
