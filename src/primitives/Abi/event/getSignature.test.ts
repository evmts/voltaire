/**
 * Unit tests for getSignature function
 */

import { describe, expect, it } from "vitest";
import { getSignature } from "./getSignature.js";

describe("getSignature", () => {
	it("generates signature for simple event", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from" },
				{ type: "address", name: "to" },
				{ type: "uint256", name: "value" },
			],
		};

		expect(getSignature(event)).toBe("Transfer(address,address,uint256)");
	});

	it("generates signature for event with no inputs", () => {
		const event = {
			type: "event" as const,
			name: "Ping",
			inputs: [],
		};

		expect(getSignature(event)).toBe("Ping()");
	});

	it("generates signature for event with single input", () => {
		const event = {
			type: "event" as const,
			name: "Approval",
			inputs: [{ type: "address", name: "owner" }],
		};

		expect(getSignature(event)).toBe("Approval(address)");
	});

	it("generates signature ignoring indexed property", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		expect(getSignature(event)).toBe("Transfer(address,address,uint256)");
	});

	it("generates signature ignoring anonymous property", () => {
		const event = {
			type: "event" as const,
			name: "Log",
			anonymous: true,
			inputs: [{ type: "bytes32", name: "data" }],
		};

		expect(getSignature(event)).toBe("Log(bytes32)");
	});

	it("handles complex types", () => {
		const event = {
			type: "event" as const,
			name: "ComplexEvent",
			inputs: [
				{ type: "uint256[]", name: "amounts" },
				{ type: "bytes", name: "data" },
				{ type: "string", name: "message" },
			],
		};

		expect(getSignature(event)).toBe("ComplexEvent(uint256[],bytes,string)");
	});

	it("handles tuple types", () => {
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

		expect(getSignature(event)).toBe("TupleEvent((address,uint256))");
	});

	it("handles fixed-size arrays", () => {
		const event = {
			type: "event" as const,
			name: "ArrayEvent",
			inputs: [
				{ type: "uint256[3]", name: "values" },
				{ type: "address[2]", name: "addresses" },
			],
		};

		expect(getSignature(event)).toBe("ArrayEvent(uint256[3],address[2])");
	});

	it("handles mixed parameter types", () => {
		const event = {
			type: "event" as const,
			name: "MixedEvent",
			inputs: [
				{ type: "uint8", name: "a" },
				{ type: "uint16", name: "b" },
				{ type: "uint32", name: "c" },
				{ type: "uint64", name: "d" },
				{ type: "uint128", name: "e" },
				{ type: "uint256", name: "f" },
			],
		};

		expect(getSignature(event)).toBe(
			"MixedEvent(uint8,uint16,uint32,uint64,uint128,uint256)",
		);
	});

	it("handles bytes types of different sizes", () => {
		const event = {
			type: "event" as const,
			name: "BytesEvent",
			inputs: [
				{ type: "bytes1", name: "a" },
				{ type: "bytes4", name: "b" },
				{ type: "bytes32", name: "c" },
				{ type: "bytes", name: "d" },
			],
		};

		expect(getSignature(event)).toBe("BytesEvent(bytes1,bytes4,bytes32,bytes)");
	});

	it("handles int types", () => {
		const event = {
			type: "event" as const,
			name: "IntEvent",
			inputs: [
				{ type: "int8", name: "a" },
				{ type: "int256", name: "b" },
			],
		};

		expect(getSignature(event)).toBe("IntEvent(int8,int256)");
	});

	it("handles bool type", () => {
		const event = {
			type: "event" as const,
			name: "BoolEvent",
			inputs: [
				{ type: "bool", name: "flag1" },
				{ type: "bool", name: "flag2" },
			],
		};

		expect(getSignature(event)).toBe("BoolEvent(bool,bool)");
	});

	it("handles string type", () => {
		const event = {
			type: "event" as const,
			name: "StringEvent",
			inputs: [{ type: "string", name: "message" }],
		};

		expect(getSignature(event)).toBe("StringEvent(string)");
	});

	it("generates signature with many parameters", () => {
		const event = {
			type: "event" as const,
			name: "MultiParam",
			inputs: [
				{ type: "address", name: "p1" },
				{ type: "uint256", name: "p2" },
				{ type: "bool", name: "p3" },
				{ type: "bytes", name: "p4" },
				{ type: "string", name: "p5" },
				{ type: "address[]", name: "p6" },
				{ type: "uint256[]", name: "p7" },
			],
		};

		expect(getSignature(event)).toBe(
			"MultiParam(address,uint256,bool,bytes,string,address[],uint256[])",
		);
	});

	it("works with event name containing underscores", () => {
		const event = {
			type: "event" as const,
			name: "Transfer_With_Underscores",
			inputs: [{ type: "uint256", name: "value" }],
		};

		expect(getSignature(event)).toBe("Transfer_With_Underscores(uint256)");
	});

	it("works with event name containing numbers", () => {
		const event = {
			type: "event" as const,
			name: "Event123",
			inputs: [{ type: "uint256", name: "value" }],
		};

		expect(getSignature(event)).toBe("Event123(uint256)");
	});
});
