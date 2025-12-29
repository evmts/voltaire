/**
 * Unit tests for decodeLog
 */

import { describe, expect, it } from "vitest";
import type { BrandedAddress as Address } from "../Address/AddressType.js";
import * as Hex from "../Hex/index.js";
import type { Abi as AbiType } from "./Abi.js";
import { AbiItemNotFoundError } from "./Errors.js";
import { decodeLog } from "./decodeLog.js";
import * as Abi from "./index.js";

const transferEvent = {
	type: "event",
	name: "Transfer",
	inputs: [
		{ type: "address", name: "from", indexed: true },
		{ type: "address", name: "to", indexed: true },
		{ type: "uint256", name: "value", indexed: false },
	],
} as const satisfies Abi.Event;

const approvalEvent = {
	type: "event",
	name: "Approval",
	inputs: [
		{ type: "address", name: "owner", indexed: true },
		{ type: "address", name: "spender", indexed: true },
		{ type: "uint256", name: "value", indexed: false },
	],
} as const satisfies Abi.Event;

const mockAbi = [
	{
		type: "function",
		name: "transfer",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
	transferEvent,
	approvalEvent,
] as const satisfies Abi;

describe("decodeLog", () => {
	it("decodes Transfer event log", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(mockAbi, log);

		expect(decoded.event).toBe("Transfer");
		expect(decoded.params.from).toBe(from);
		expect(decoded.params.to).toBe(to);
		expect(decoded.params.value).toBe(value);
	});

	it("decodes Approval event log", () => {
		const owner = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const spender = "0x0000000000000000000000000000000000000001" as Address;
		const value = 2000n;

		const topics = Abi.Event.encodeTopics(approvalEvent, { owner, spender });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(mockAbi, log);

		expect(decoded.event).toBe("Approval");
		expect(decoded.params.owner).toBe(owner);
		expect(decoded.params.spender).toBe(spender);
		expect(decoded.params.value).toBe(value);
	});

	it("decodes log with hex string topics and data", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		// Convert to hex strings
		const hexTopics = topics.map((t) => Hex.fromBytes(t));
		const hexData = Hex.fromBytes(data);

		const log = { topics: hexTopics, data: hexData };
		const decoded = decodeLog(mockAbi, log);

		expect(decoded.event).toBe("Transfer");
		expect(decoded.params.from).toBe(from);
		expect(decoded.params.to).toBe(to);
	});

	it("decodes log with Uint8Array topics and data", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(mockAbi, log);

		expect(decoded.event).toBe("Transfer");
	});

	it("throws on log with no topics", () => {
		const log = { topics: [], data: new Uint8Array(32) };

		expect(() => decodeLog(mockAbi, log)).toThrow(AbiItemNotFoundError);
		expect(() => decodeLog(mockAbi, log)).toThrow(/No topics in log/);
	});

	it("throws on log with undefined topic0", () => {
		// This is a bit contrived but tests the guard
		const log = {
			topics: [undefined as any],
			data: new Uint8Array(32),
		};

		expect(() => decodeLog(mockAbi, log)).toThrow(AbiItemNotFoundError);
		expect(() => decodeLog(mockAbi, log)).toThrow(/Missing topic0/);
	});

	it("throws on unknown event selector", () => {
		const unknownSelector = new Uint8Array(32).fill(0xff);
		const log = { topics: [unknownSelector], data: new Uint8Array(32) };

		expect(() => decodeLog(mockAbi, log)).toThrow(AbiItemNotFoundError);
		expect(() => decodeLog(mockAbi, log)).toThrow(/not found in ABI/);
	});

	it("throws on empty ABI", () => {
		const emptyAbi: Abi = [];
		const topics = Abi.Event.encodeTopics(transferEvent, {
			from: "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address,
			to: "0x0000000000000000000000000000000000000001" as Address,
		});
		const data = Abi.encodeParameters([{ type: "uint256" }], [1000n]);

		const log = { topics: topics as any, data };

		expect(() => decodeLog(emptyAbi, log)).toThrow(AbiItemNotFoundError);
	});

	it("handles event with only indexed parameters", () => {
		const indexedOnlyEvent = {
			type: "event",
			name: "IndexedOnly",
			inputs: [
				{ type: "address", name: "addr1", indexed: true },
				{ type: "address", name: "addr2", indexed: true },
			],
		} as const satisfies Abi.Event;

		const abiWithIndexed = [indexedOnlyEvent] as const satisfies Abi;

		const addr1 = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const addr2 = "0x0000000000000000000000000000000000000001" as Address;

		const topics = Abi.Event.encodeTopics(indexedOnlyEvent, { addr1, addr2 });
		const data = new Uint8Array(0); // No non-indexed data

		const log = { topics: topics as any, data };
		const decoded = decodeLog(abiWithIndexed, log);

		expect(decoded.event).toBe("IndexedOnly");
		expect(decoded.params.addr1).toBe(addr1);
		expect(decoded.params.addr2).toBe(addr2);
	});

	it("handles event with no indexed parameters", () => {
		const nonIndexedEvent = {
			type: "event",
			name: "NonIndexed",
			inputs: [
				{ type: "uint256", name: "value1", indexed: false },
				{ type: "uint256", name: "value2", indexed: false },
			],
		} as const satisfies Abi.Event;

		const abiWithNonIndexed = [nonIndexedEvent] as const satisfies Abi;

		const selector = Abi.Event.getSelector(nonIndexedEvent);
		const data = Abi.encodeParameters(
			[{ type: "uint256" }, { type: "uint256" }],
			[100n, 200n] as any,
		);

		const log = { topics: [selector], data };
		const decoded = decodeLog(abiWithNonIndexed, log);

		expect(decoded.event).toBe("NonIndexed");
		expect(decoded.params.value1).toBe(100n);
		expect(decoded.params.value2).toBe(200n);
	});

	it("preserves parameter types", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 999999999999999999n; // Large bigint

		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(mockAbi, log);

		expect(typeof decoded.params.from).toBe("string");
		expect(typeof decoded.params.to).toBe("string");
		expect(typeof decoded.params.value).toBe("bigint");
		expect(decoded.params.value).toBe(value);
	});

	it("handles ABI with functions (ignores non-events)", () => {
		const mixedAbi = [
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			},
			{
				type: "function",
				name: "approve",
				stateMutability: "nonpayable",
				inputs: [],
				outputs: [],
			},
			transferEvent,
		] as const satisfies Abi;

		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(mixedAbi, log);

		expect(decoded.event).toBe("Transfer");
	});

	it("round-trips encoding and decoding", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000n;

		// Encode
		const topics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		// Decode
		const log = { topics: topics as any, data };
		const decoded = decodeLog(mockAbi, log);

		// Verify
		expect(decoded.params.from).toBe(from);
		expect(decoded.params.to).toBe(to);
		expect(decoded.params.value).toBe(value);
	});

	it("handles event with complex types", () => {
		const complexEvent = {
			type: "event",
			name: "ComplexEvent",
			inputs: [
				{ type: "address", name: "user", indexed: true },
				{ type: "bytes32", name: "hash", indexed: true },
				{ type: "string", name: "message", indexed: false },
				{ type: "uint256[]", name: "values", indexed: false },
			],
		} as const satisfies Abi.Event;

		const abiWithComplex = [complexEvent] as const satisfies Abi;

		const user = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const hash = `0x${"ab".repeat(32)}`;
		const message = "Hello World";
		const values = [1n, 2n, 3n];

		const topics = Abi.Event.encodeTopics(complexEvent, { user, hash });
		const data = Abi.encodeParameters(
			[{ type: "string" }, { type: "uint256[]" }],
			[message, values],
		);

		const log = { topics: topics as any, data };
		const decoded = decodeLog(abiWithComplex, log);

		expect(decoded.event).toBe("ComplexEvent");
		expect(decoded.params.user).toBe(user);
		expect(decoded.params.message).toBe(message);
		expect(decoded.params.values).toEqual(values);
	});

	it("distinguishes between different events by selector", () => {
		const from = "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;

		// Transfer event
		const transferTopics = Abi.Event.encodeTopics(transferEvent, { from, to });
		const transferData = Abi.encodeParameters([{ type: "uint256" }], [1000n]);
		const transferLog = { topics: transferTopics as any, data: transferData };

		// Approval event
		const approvalTopics = Abi.Event.encodeTopics(approvalEvent, {
			owner: from,
			spender: to,
		});
		const approvalData = Abi.encodeParameters([{ type: "uint256" }], [2000n]);
		const approvalLog = { topics: approvalTopics as any, data: approvalData };

		const decodedTransfer = decodeLog(mockAbi, transferLog);
		const decodedApproval = decodeLog(mockAbi, approvalLog);

		expect(decodedTransfer.event).toBe("Transfer");
		expect(decodedApproval.event).toBe("Approval");
		expect(decodedTransfer.event).not.toBe(decodedApproval.event);
	});
});
