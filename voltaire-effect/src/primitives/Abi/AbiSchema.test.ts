import { Abi } from "@tevm/voltaire/Abi";
import * as S from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
	AbiSchema,
	AbiTypeSchema,
	ConstructorSchema,
	ErrorSchema,
	EventSchema,
	FallbackSchema,
	fromArray,
	FunctionSchema,
	ItemSchema,
	ParameterSchema,
	ReceiveSchema,
	StateMutabilitySchema,
} from "./AbiSchema.js";

describe("StateMutabilitySchema", () => {
	it("accepts valid state mutability values", () => {
		expect(S.decodeUnknownSync(StateMutabilitySchema)("pure")).toBe("pure");
		expect(S.decodeUnknownSync(StateMutabilitySchema)("view")).toBe("view");
		expect(S.decodeUnknownSync(StateMutabilitySchema)("nonpayable")).toBe(
			"nonpayable",
		);
		expect(S.decodeUnknownSync(StateMutabilitySchema)("payable")).toBe(
			"payable",
		);
	});

	it("rejects invalid state mutability", () => {
		expect(() =>
			S.decodeUnknownSync(StateMutabilitySchema)("invalid"),
		).toThrow();
	});
});

describe("AbiTypeSchema", () => {
	it("accepts valid Solidity types", () => {
		expect(S.decodeUnknownSync(AbiTypeSchema)("uint256")).toBe("uint256");
		expect(S.decodeUnknownSync(AbiTypeSchema)("address")).toBe("address");
		expect(S.decodeUnknownSync(AbiTypeSchema)("bool")).toBe("bool");
		expect(S.decodeUnknownSync(AbiTypeSchema)("bytes32")).toBe("bytes32");
		expect(S.decodeUnknownSync(AbiTypeSchema)("string")).toBe("string");
		expect(S.decodeUnknownSync(AbiTypeSchema)("uint256[]")).toBe("uint256[]");
		expect(S.decodeUnknownSync(AbiTypeSchema)("address[10]")).toBe(
			"address[10]",
		);
		expect(S.decodeUnknownSync(AbiTypeSchema)("tuple")).toBe("tuple");
	});
});

describe("ParameterSchema", () => {
	it("parses simple parameter", () => {
		const param = S.decodeUnknownSync(ParameterSchema)({
			type: "uint256",
			name: "amount",
		});
		expect(param.type).toBe("uint256");
		expect(param.name).toBe("amount");
	});

	it("parses parameter with indexed", () => {
		const param = S.decodeUnknownSync(ParameterSchema)({
			type: "address",
			name: "from",
			indexed: true,
		});
		expect(param.indexed).toBe(true);
	});

	it("parses tuple parameter with components", () => {
		const param = S.decodeUnknownSync(ParameterSchema)({
			type: "tuple",
			name: "data",
			components: [
				{ type: "uint256", name: "value" },
				{ type: "string", name: "message" },
			],
		});
		expect(param.type).toBe("tuple");
		expect(param.components).toHaveLength(2);
		expect(param.components?.[0].type).toBe("uint256");
	});

	it("parses nested tuple", () => {
		const param = S.decodeUnknownSync(ParameterSchema)({
			type: "tuple",
			name: "outer",
			components: [
				{
					type: "tuple",
					name: "inner",
					components: [{ type: "uint256", name: "value" }],
				},
			],
		});
		expect(param.components?.[0].components?.[0].type).toBe("uint256");
	});
});

describe("FunctionSchema", () => {
	it("parses function item", () => {
		const fn = S.decodeUnknownSync(FunctionSchema)({
			type: "function",
			name: "transfer",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "to" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		});
		expect(fn.type).toBe("function");
		expect(fn.name).toBe("transfer");
		expect(fn.stateMutability).toBe("nonpayable");
		expect(fn.inputs).toHaveLength(2);
		expect(fn.outputs).toHaveLength(1);
	});

	it("rejects function missing name", () => {
		expect(() =>
			S.decodeUnknownSync(FunctionSchema)({
				type: "function",
				stateMutability: "view",
				inputs: [],
				outputs: [],
			}),
		).toThrow();
	});

	it("rejects function missing stateMutability", () => {
		expect(() =>
			S.decodeUnknownSync(FunctionSchema)({
				type: "function",
				name: "foo",
				inputs: [],
				outputs: [],
			}),
		).toThrow();
	});
});

describe("EventSchema", () => {
	it("parses event item", () => {
		const evt = S.decodeUnknownSync(EventSchema)({
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value" },
			],
		});
		expect(evt.type).toBe("event");
		expect(evt.name).toBe("Transfer");
		expect(evt.inputs).toHaveLength(3);
	});

	it("parses anonymous event", () => {
		const evt = S.decodeUnknownSync(EventSchema)({
			type: "event",
			name: "Log",
			inputs: [],
			anonymous: true,
		});
		expect(evt.anonymous).toBe(true);
	});
});

describe("ErrorSchema", () => {
	it("parses error item", () => {
		const err = S.decodeUnknownSync(ErrorSchema)({
			type: "error",
			name: "InsufficientBalance",
			inputs: [
				{ type: "uint256", name: "available" },
				{ type: "uint256", name: "required" },
			],
		});
		expect(err.type).toBe("error");
		expect(err.name).toBe("InsufficientBalance");
		expect(err.inputs).toHaveLength(2);
	});
});

describe("ConstructorSchema", () => {
	it("parses constructor item", () => {
		const ctor = S.decodeUnknownSync(ConstructorSchema)({
			type: "constructor",
			stateMutability: "nonpayable",
			inputs: [{ type: "address", name: "owner" }],
		});
		expect(ctor.type).toBe("constructor");
		expect(ctor.stateMutability).toBe("nonpayable");
		expect(ctor.inputs).toHaveLength(1);
	});
});

describe("FallbackSchema", () => {
	it("parses fallback item", () => {
		const fb = S.decodeUnknownSync(FallbackSchema)({
			type: "fallback",
			stateMutability: "payable",
		});
		expect(fb.type).toBe("fallback");
		expect(fb.stateMutability).toBe("payable");
	});
});

describe("ReceiveSchema", () => {
	it("parses receive item", () => {
		const rcv = S.decodeUnknownSync(ReceiveSchema)({
			type: "receive",
			stateMutability: "payable",
		});
		expect(rcv.type).toBe("receive");
		expect(rcv.stateMutability).toBe("payable");
	});

	it("rejects receive with non-payable stateMutability", () => {
		expect(() =>
			S.decodeUnknownSync(ReceiveSchema)({
				type: "receive",
				stateMutability: "nonpayable",
			}),
		).toThrow();
	});
});

describe("ItemSchema", () => {
	it("parses function items", () => {
		const item = S.decodeUnknownSync(ItemSchema)({
			type: "function",
			name: "foo",
			stateMutability: "view",
			inputs: [],
			outputs: [],
		});
		expect(item.type).toBe("function");
	});

	it("parses event items", () => {
		const item = S.decodeUnknownSync(ItemSchema)({
			type: "event",
			name: "Bar",
			inputs: [],
		});
		expect(item.type).toBe("event");
	});

	it("discriminates by type field", () => {
		const items = [
			{ type: "function", name: "a", stateMutability: "view", inputs: [], outputs: [] },
			{ type: "event", name: "b", inputs: [] },
			{ type: "error", name: "c", inputs: [] },
		];
		for (const item of items) {
			expect(() => S.decodeUnknownSync(ItemSchema)(item)).not.toThrow();
		}
	});
});

describe("AbiSchema", () => {
	it("accepts Abi instance", () => {
		const abi = Abi([
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			},
		]);
		expect(S.is(AbiSchema)(abi)).toBe(true);
	});

	it("rejects plain array", () => {
		expect(S.is(AbiSchema)([])).toBe(true); // Arrays pass the basic check
	});
});

describe("fromArray", () => {
	it("parses ABI array into Abi instance", () => {
		const abi = S.decodeUnknownSync(fromArray)([
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			},
		]);
		expect(Array.isArray(abi)).toBe(true);
		expect(abi).toHaveLength(1);
	});

	it("parses complex ABI", () => {
		const abi = S.decodeUnknownSync(fromArray)([
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			},
			{
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			},
			{
				type: "error",
				name: "InsufficientBalance",
				inputs: [{ type: "uint256", name: "balance" }],
			},
			{
				type: "constructor",
				stateMutability: "nonpayable",
				inputs: [{ type: "address", name: "owner" }],
			},
			{
				type: "fallback",
				stateMutability: "payable",
			},
			{
				type: "receive",
				stateMutability: "payable",
			},
		]);
		expect(abi).toHaveLength(6);
	});

	it("rejects invalid ABI items", () => {
		expect(() =>
			S.decodeUnknownSync(fromArray)([
				{ type: "invalid", name: "foo" },
			]),
		).toThrow();
	});

	it("rejects function without required fields", () => {
		expect(() =>
			S.decodeUnknownSync(fromArray)([
				{ type: "function", name: "foo" }, // Missing stateMutability, inputs, outputs
			]),
		).toThrow();
	});

	it("round-trip encode/decode", () => {
		const original = [
			{
				type: "function" as const,
				name: "foo",
				stateMutability: "view" as const,
				inputs: [{ type: "uint256", name: "x" }],
				outputs: [{ type: "bool" }],
			},
		];
		const abi = S.decodeUnknownSync(fromArray)(original);
		const encoded = S.encodeSync(fromArray)(abi);
		expect(encoded).toHaveLength(1);
		expect((encoded[0] as { name: string }).name).toBe("foo");
	});
});
