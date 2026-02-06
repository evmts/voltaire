/**
 * Unit tests for isFunction type guard
 */

import { describe, expect, it } from "vitest";
import { isFunction } from "./isFunction.js";

describe("isFunction", () => {
	it("returns true for function items", () => {
		const item = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [],
		} as const;

		expect(isFunction(item)).toBe(true);
	});

	it("returns false for event items", () => {
		const item = {
			type: "event",
			name: "Transfer",
			inputs: [],
		} as const;

		expect(isFunction(item)).toBe(false);
	});

	it("returns false for error items", () => {
		const item = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		expect(isFunction(item)).toBe(false);
	});

	it("returns false for constructor items", () => {
		const item = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		expect(isFunction(item)).toBe(false);
	});

	it("returns false for fallback items", () => {
		const item = {
			type: "fallback",
			stateMutability: "payable",
		} as const;

		expect(isFunction(item)).toBe(false);
	});

	it("returns false for receive items", () => {
		const item = {
			type: "receive",
			stateMutability: "payable",
		} as const;

		expect(isFunction(item)).toBe(false);
	});

	it("works with view functions", () => {
		const item = {
			type: "function",
			name: "balanceOf",
			stateMutability: "view",
			inputs: [{ type: "address", name: "account" }],
			outputs: [{ type: "uint256", name: "" }],
		} as const;

		expect(isFunction(item)).toBe(true);
	});

	it("works with pure functions", () => {
		const item = {
			type: "function",
			name: "calculate",
			stateMutability: "pure",
			inputs: [],
			outputs: [],
		} as const;

		expect(isFunction(item)).toBe(true);
	});

	it("works with payable functions", () => {
		const item = {
			type: "function",
			name: "deposit",
			stateMutability: "payable",
			inputs: [],
			outputs: [],
		} as const;

		expect(isFunction(item)).toBe(true);
	});
});
