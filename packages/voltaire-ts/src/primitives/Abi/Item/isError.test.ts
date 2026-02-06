/**
 * Unit tests for isError type guard
 */

import { describe, expect, it } from "vitest";
import { isError } from "./isError.js";

describe("isError", () => {
	it("returns true for error items", () => {
		const item = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		expect(isError(item)).toBe(true);
	});

	it("returns false for function items", () => {
		const item = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [],
		} as const;

		expect(isError(item)).toBe(false);
	});

	it("returns false for event items", () => {
		const item = {
			type: "event",
			name: "Transfer",
			inputs: [],
		} as const;

		expect(isError(item)).toBe(false);
	});

	it("returns false for constructor items", () => {
		const item = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		expect(isError(item)).toBe(false);
	});

	it("returns false for fallback items", () => {
		const item = {
			type: "fallback",
			stateMutability: "payable",
		} as const;

		expect(isError(item)).toBe(false);
	});

	it("returns false for receive items", () => {
		const item = {
			type: "receive",
			stateMutability: "payable",
		} as const;

		expect(isError(item)).toBe(false);
	});

	it("works with error with parameters", () => {
		const item = {
			type: "error",
			name: "InsufficientBalance",
			inputs: [
				{ type: "uint256", name: "available" },
				{ type: "uint256", name: "required" },
			],
		} as const;

		expect(isError(item)).toBe(true);
	});

	it("works with error without parameters", () => {
		const item = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		expect(isError(item)).toBe(true);
	});
});
