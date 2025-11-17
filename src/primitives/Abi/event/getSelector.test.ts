/**
 * Unit tests for getSelector factory function
 */

import { describe, expect, it } from "vitest";
import { GetSelector } from "./getSelector.js";
import * as Hash from "../../Hash/index.js";

describe("GetSelector", () => {
	const getSelector = GetSelector({ keccak256String: Hash.keccak256String });

	it("computes selector for Transfer event", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);

		// Known selector for Transfer(address,address,uint256)
		// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
		const expected = new Uint8Array([
			0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
			0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
			0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
		]);

		expect(selector).toEqual(expected);
	});

	it("computes selector for Approval event", () => {
		const event = {
			type: "event" as const,
			name: "Approval",
			inputs: [
				{ type: "address", name: "owner", indexed: true },
				{ type: "address", name: "spender", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);

		// Known selector for Approval(address,address,uint256)
		// 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
		const expected = new Uint8Array([
			0x8c, 0x5b, 0xe1, 0xe5, 0xeb, 0xec, 0x7d, 0x5b, 0xd1, 0x4f, 0x71, 0x42,
			0x7d, 0x1e, 0x84, 0xf3, 0xdd, 0x03, 0x14, 0xc0, 0xf7, 0xb2, 0x29, 0x1e,
			0x5b, 0x20, 0x0a, 0xc8, 0xc7, 0xc3, 0xb9, 0x25,
		]);

		expect(selector).toEqual(expected);
	});

	it("computes selector for event with no parameters", () => {
		const event = {
			type: "event" as const,
			name: "Ping",
			inputs: [],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("computes same selector regardless of indexed property", () => {
		const event1 = {
			type: "event" as const,
			name: "Test",
			inputs: [
				{ type: "address", name: "addr", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const event2 = {
			type: "event" as const,
			name: "Test",
			inputs: [
				{ type: "address", name: "addr", indexed: false },
				{ type: "uint256", name: "value", indexed: true },
			],
		};

		const selector1 = getSelector(event1);
		const selector2 = getSelector(event2);

		expect(selector1).toEqual(selector2);
	});

	it("computes same selector regardless of anonymous property", () => {
		const event1 = {
			type: "event" as const,
			name: "Log",
			inputs: [{ type: "bytes32", name: "data" }],
		};

		const event2 = {
			type: "event" as const,
			name: "Log",
			anonymous: true,
			inputs: [{ type: "bytes32", name: "data" }],
		};

		const selector1 = getSelector(event1);
		const selector2 = getSelector(event2);

		expect(selector1).toEqual(selector2);
	});

	it("computes different selectors for different event names", () => {
		const event1 = {
			type: "event" as const,
			name: "EventA",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const event2 = {
			type: "event" as const,
			name: "EventB",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const selector1 = getSelector(event1);
		const selector2 = getSelector(event2);

		expect(selector1).not.toEqual(selector2);
	});

	it("computes different selectors for different parameter types", () => {
		const event1 = {
			type: "event" as const,
			name: "Test",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const event2 = {
			type: "event" as const,
			name: "Test",
			inputs: [{ type: "uint128", name: "value" }],
		};

		const selector1 = getSelector(event1);
		const selector2 = getSelector(event2);

		expect(selector1).not.toEqual(selector2);
	});

	it("computes different selectors for different parameter counts", () => {
		const event1 = {
			type: "event" as const,
			name: "Test",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const event2 = {
			type: "event" as const,
			name: "Test",
			inputs: [
				{ type: "uint256", name: "value" },
				{ type: "address", name: "addr" },
			],
		};

		const selector1 = getSelector(event1);
		const selector2 = getSelector(event2);

		expect(selector1).not.toEqual(selector2);
	});

	it("handles complex event with arrays", () => {
		const event = {
			type: "event" as const,
			name: "ArrayEvent",
			inputs: [
				{ type: "uint256[]", name: "values" },
				{ type: "address[]", name: "addresses" },
			],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("handles event with tuple type", () => {
		const event = {
			type: "event" as const,
			name: "TupleEvent",
			inputs: [
				{
					type: "tuple",
					name: "data",
					components: [
						{ type: "address", name: "addr" },
						{ type: "uint256", name: "value" },
					],
				},
			],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("handles event with bytes type", () => {
		const event = {
			type: "event" as const,
			name: "BytesEvent",
			inputs: [
				{ type: "bytes", name: "data" },
				{ type: "bytes32", name: "hash" },
			],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("handles event with string type", () => {
		const event = {
			type: "event" as const,
			name: "StringEvent",
			inputs: [{ type: "string", name: "message" }],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("handles event with bool type", () => {
		const event = {
			type: "event" as const,
			name: "BoolEvent",
			inputs: [{ type: "bool", name: "flag" }],
		};

		const selector = getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});

	it("produces deterministic results", () => {
		const event = {
			type: "event" as const,
			name: "Test",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const selector1 = getSelector(event);
		const selector2 = getSelector(event);

		expect(selector1).toEqual(selector2);
	});

	it("works with factory pattern allowing custom keccak256String", () => {
		const customKeccak256String = (str: string) => {
			return Hash.keccak256String(str);
		};

		const customGetSelector = GetSelector({
			keccak256String: customKeccak256String,
		});

		const event = {
			type: "event" as const,
			name: "Test",
			inputs: [{ type: "uint256", name: "value" }],
		};

		const selector = customGetSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});
});
