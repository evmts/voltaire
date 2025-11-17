/**
 * Unit tests for isConstructor type guard
 */

import { describe, expect, it } from "vitest";
import { isConstructor } from "./isConstructor.js";

describe("isConstructor", () => {
	it("returns true for constructor items", () => {
		const item = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		expect(isConstructor(item)).toBe(true);
	});

	it("returns false for function items", () => {
		const item = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [],
		} as const;

		expect(isConstructor(item)).toBe(false);
	});

	it("returns false for event items", () => {
		const item = {
			type: "event",
			name: "Transfer",
			inputs: [],
		} as const;

		expect(isConstructor(item)).toBe(false);
	});

	it("returns false for error items", () => {
		const item = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		expect(isConstructor(item)).toBe(false);
	});

	it("returns false for fallback items", () => {
		const item = {
			type: "fallback",
			stateMutability: "payable",
		} as const;

		expect(isConstructor(item)).toBe(false);
	});

	it("returns false for receive items", () => {
		const item = {
			type: "receive",
			stateMutability: "payable",
		} as const;

		expect(isConstructor(item)).toBe(false);
	});

	it("works with constructor with parameters", () => {
		const item = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "string", name: "name" },
				{ type: "string", name: "symbol" },
			],
		} as const;

		expect(isConstructor(item)).toBe(true);
	});

	it("works with payable constructor", () => {
		const item = {
			type: "constructor",
			stateMutability: "payable",
			inputs: [],
		} as const;

		expect(isConstructor(item)).toBe(true);
	});
});
