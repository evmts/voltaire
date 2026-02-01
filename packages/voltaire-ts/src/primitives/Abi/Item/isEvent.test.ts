/**
 * Unit tests for isEvent type guard
 */

import { describe, expect, it } from "vitest";
import { isEvent } from "./isEvent.js";

describe("isEvent", () => {
	it("returns true for event items", () => {
		const item = {
			type: "event",
			name: "Transfer",
			inputs: [],
		} as const;

		expect(isEvent(item)).toBe(true);
	});

	it("returns false for function items", () => {
		const item = {
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [],
			outputs: [],
		} as const;

		expect(isEvent(item)).toBe(false);
	});

	it("returns false for error items", () => {
		const item = {
			type: "error",
			name: "Unauthorized",
			inputs: [],
		} as const;

		expect(isEvent(item)).toBe(false);
	});

	it("returns false for constructor items", () => {
		const item = {
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [],
		} as const;

		expect(isEvent(item)).toBe(false);
	});

	it("returns false for fallback items", () => {
		const item = {
			type: "fallback",
			stateMutability: "payable",
		} as const;

		expect(isEvent(item)).toBe(false);
	});

	it("returns false for receive items", () => {
		const item = {
			type: "receive",
			stateMutability: "payable",
		} as const;

		expect(isEvent(item)).toBe(false);
	});

	it("works with event with indexed parameters", () => {
		const item = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		} as const;

		expect(isEvent(item)).toBe(true);
	});

	it("works with anonymous events", () => {
		const item = {
			type: "event",
			name: "Approval",
			anonymous: true,
			inputs: [],
		} as const;

		expect(isEvent(item)).toBe(true);
	});
});
