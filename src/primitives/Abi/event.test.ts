/**
 * Comprehensive tests for event encoding/decoding
 * Tests topic encoding, indexed parameters, log data decoding
 */

import { describe, expect, it } from "vitest";
import * as Abi from "./index.js";
import type { Event as AbiEvent } from "./types.js";
import type { Address } from "../Address/index.js";

// ============================================================================
// Event Signature and Selector Tests
// ============================================================================

describe("Abi.Event.getSignature", () => {
	it("generates signature for event with no parameters", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Trigger",
			inputs: [],
		};
		expect(Abi.Event.getSignature(event)).toBe("Trigger()");
	});

	it("generates signature for ERC20 Transfer event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};
		expect(Abi.Event.getSignature(event)).toBe(
			"Transfer(address,address,uint256)",
		);
	});

	it("generates signature for ERC20 Approval event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Approval",
			inputs: [
				{ type: "address", name: "owner", indexed: true },
				{ type: "address", name: "spender", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};
		expect(Abi.Event.getSignature(event)).toBe(
			"Approval(address,address,uint256)",
		);
	});

	it("generates signature with tuple", () => {
		const event: AbiEvent = {
			type: "event",
			name: "DataUpdate",
			inputs: [
				{
					type: "tuple",
					name: "data",
					indexed: false,
					components: [
						{ type: "address", name: "user" },
						{ type: "uint256", name: "amount" },
					],
				},
			],
		};
		expect(Abi.Event.getSignature(event)).toBe("DataUpdate(tuple)");
	});

	it("generates signature with array", () => {
		const event: AbiEvent = {
			type: "event",
			name: "BatchTransfer",
			inputs: [
				{ type: "address[]", name: "recipients", indexed: false },
				{ type: "uint256[]", name: "amounts", indexed: false },
			],
		};
		expect(Abi.Event.getSignature(event)).toBe(
			"BatchTransfer(address[],uint256[])",
		);
	});
});

describe("Abi.Event.getSelector", () => {
	it("computes selector for ERC20 Transfer", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const selector = Abi.Event.getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);

		// Transfer(address,address,uint256) = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
		const hex = Array.from(selector)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		expect(hex).toBe(
			"ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
		);
	});

	it("computes selector for ERC20 Approval", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Approval",
			inputs: [
				{ type: "address", name: "owner", indexed: true },
				{ type: "address", name: "spender", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const selector = Abi.Event.getSelector(event);
		expect(selector.length).toBe(32);

		// Approval(address,address,uint256) = 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925
		const hex = Array.from(selector)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		expect(hex).toBe(
			"8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
		);
	});

	it("computes selector for custom event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "CustomEvent",
			inputs: [
				{ type: "uint256", name: "value", indexed: true },
				{ type: "address", name: "user", indexed: false },
			],
		};

		const selector = Abi.Event.getSelector(event);
		expect(selector).toBeInstanceOf(Uint8Array);
		expect(selector.length).toBe(32);
	});
});

// ============================================================================
// Topic Encoding Tests
// ============================================================================

describe("Abi.Event.encodeTopics", () => {
	it("encodes topics for Transfer event with both indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const from = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;

		const topics = Abi.Event.encodeTopics(event, { from, to });

		// Should have 3 topics: topic0 (selector) + 2 indexed params
		expect(topics.length).toBe(3);
		expect(topics[0]).toBeInstanceOf(Uint8Array);
		expect(topics[0]?.length).toBe(32); // topic0 is event selector

		// Topic1 should be address 'from' (left-padded to 32 bytes)
		expect(topics[1]).toBeInstanceOf(Uint8Array);
		expect(topics[1]?.length).toBe(32);

		// Topic2 should be address 'to'
		expect(topics[2]).toBeInstanceOf(Uint8Array);
		expect(topics[2]?.length).toBe(32);
	});

	it("encodes topics with one indexed param", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Approval",
			inputs: [
				{ type: "address", name: "owner", indexed: true },
				{ type: "address", name: "spender", indexed: false },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const owner = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;

		const topics = Abi.Event.encodeTopics(event, { owner });

		// Should have 2 topics: topic0 + 1 indexed param
		expect(topics.length).toBe(2);
		expect(topics[0]?.length).toBe(32);
		expect(topics[1]?.length).toBe(32);
	});

	it("encodes topics for event with no indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "DataUpdate",
			inputs: [
				{ type: "uint256", name: "value", indexed: false },
				{ type: "address", name: "user", indexed: false },
			],
		};

		const topics = Abi.Event.encodeTopics(event, {});

		// Should only have topic0 (event selector)
		expect(topics.length).toBe(1);
		expect(topics[0]?.length).toBe(32);
	});

	it("encodes indexed uint256", () => {
		const event: AbiEvent = {
			type: "event",
			name: "ValueChanged",
			inputs: [
				{ type: "uint256", name: "oldValue", indexed: true },
				{ type: "uint256", name: "newValue", indexed: true },
			],
		};

		const topics = Abi.Event.encodeTopics(event, {
			oldValue: 100n,
			newValue: 200n,
		});

		expect(topics.length).toBe(3);
		expect(topics[1]?.length).toBe(32);
		expect(topics[2]?.length).toBe(32);
	});

	it("encodes indexed bytes32", () => {
		const event: AbiEvent = {
			type: "event",
			name: "HashStored",
			inputs: [{ type: "bytes32", name: "hash", indexed: true }],
		};

		const hash = "0x" + "ab".repeat(32);
		const topics = Abi.Event.encodeTopics(event, { hash });

		expect(topics.length).toBe(2);
		expect(topics[1]?.length).toBe(32);
	});

	it("hashes indexed dynamic types (string)", () => {
		const event: AbiEvent = {
			type: "event",
			name: "NameChanged",
			inputs: [{ type: "string", name: "newName", indexed: true }],
		};

		const topics = Abi.Event.encodeTopics(event, { newName: "Alice" });

		// Indexed string should be hashed
		expect(topics.length).toBe(2);
		expect(topics[1]?.length).toBe(32); // keccak256 hash
	});

	it("hashes indexed dynamic types (bytes)", () => {
		const event: AbiEvent = {
			type: "event",
			name: "DataStored",
			inputs: [{ type: "bytes", name: "data", indexed: true }],
		};

		const topics = Abi.Event.encodeTopics(event, { data: "0x123456" });

		// Indexed bytes should be hashed
		expect(topics.length).toBe(2);
		expect(topics[1]?.length).toBe(32); // keccak256 hash
	});

	it("hashes indexed arrays", () => {
		const event: AbiEvent = {
			type: "event",
			name: "BatchProcessed",
			inputs: [{ type: "uint256[]", name: "values", indexed: true }],
		};

		const topics = Abi.Event.encodeTopics(event, { values: [1n, 2n, 3n] });

		// Indexed array should be hashed
		expect(topics.length).toBe(2);
		expect(topics[1]?.length).toBe(32); // keccak256 hash
	});

	it("allows partial indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		// Only provide 'from', not 'to'
		const from = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const topics = Abi.Event.encodeTopics(event, { from });

		// Should have topic0 + 'from' + null for 'to'
		expect(topics.length).toBe(3);
		expect(topics[0]).toBeInstanceOf(Uint8Array);
		expect(topics[1]).toBeInstanceOf(Uint8Array);
		expect(topics[2]).toBeNull();
	});
});

// ============================================================================
// Log Decoding Tests
// ============================================================================

describe("Abi.Event.decodeLog", () => {
	it("decodes ERC20 Transfer log", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const from = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const to = "0x0000000000000000000000000000000000000001" as Address;
		const value = 1000000000000000000n;

		// Encode topics and data
		const topics = Abi.Event.encodeTopics(event, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		// Decode the log
		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.from).toBeDefined();
		expect(String(decoded.from).toLowerCase()).toBe(from.toLowerCase());
		expect(decoded.to).toBeDefined();
		expect(String(decoded.to).toLowerCase()).toBe(to.toLowerCase());
		expect(decoded.value).toBe(value);
	});

	it("decodes ERC20 Approval log", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Approval",
			inputs: [
				{ type: "address", name: "owner", indexed: true },
				{ type: "address", name: "spender", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const owner = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const spender = "0x0000000000000000000000000000000000000002" as Address;
		const value = 2000000000000000000n;

		const topics = Abi.Event.encodeTopics(event, { owner, spender });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.owner).toLowerCase()).toBe(owner.toLowerCase());
		expect(String(decoded.spender).toLowerCase()).toBe(spender.toLowerCase());
		expect(decoded.value).toBe(value);
	});

	it("decodes log with multiple non-indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Swap",
			inputs: [
				{ type: "address", name: "sender", indexed: true },
				{ type: "uint256", name: "amount0In", indexed: false },
				{ type: "uint256", name: "amount1In", indexed: false },
				{ type: "uint256", name: "amount0Out", indexed: false },
				{ type: "uint256", name: "amount1Out", indexed: false },
			],
		};

		const sender = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const topics = Abi.Event.encodeTopics(event, { sender });
		const data = Abi.encodeParameters(
			[
				{ type: "uint256" },
				{ type: "uint256" },
				{ type: "uint256" },
				{ type: "uint256" },
			],
			[1000n, 0n, 0n, 950n],
		);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.sender).toLowerCase()).toBe(sender.toLowerCase());
		expect(decoded.amount0In).toBe(1000n);
		expect(decoded.amount1In).toBe(0n);
		expect(decoded.amount0Out).toBe(0n);
		expect(decoded.amount1Out).toBe(950n);
	});

	it("decodes log with no indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "DataUpdate",
			inputs: [
				{ type: "uint256", name: "value", indexed: false },
				{ type: "address", name: "user", indexed: false },
			],
		};

		const topics = Abi.Event.encodeTopics(event, {});
		const data = Abi.encodeParameters(
			[{ type: "uint256" }, { type: "address" }],
			[42n, "0x0000000000000000000000000000000000000001"],
		);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.value).toBe(42n);
		expect(decoded.user).toBeDefined();
	});

	it("decodes log with indexed uint256", () => {
		const event: AbiEvent = {
			type: "event",
			name: "ValueChanged",
			inputs: [
				{ type: "uint256", name: "oldValue", indexed: true },
				{ type: "uint256", name: "newValue", indexed: false },
			],
		};

		const topics = Abi.Event.encodeTopics(event, { oldValue: 100n });
		const data = Abi.encodeParameters([{ type: "uint256" }], [200n]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.oldValue).toBe(100n);
		expect(decoded.newValue).toBe(200n);
	});

	it("decodes log with indexed bytes32", () => {
		const event: AbiEvent = {
			type: "event",
			name: "HashStored",
			inputs: [
				{ type: "bytes32", name: "hash", indexed: true },
				{ type: "address", name: "user", indexed: false },
			],
		};

		const hash = "0x" + "ab".repeat(32);
		const user = "0x0000000000000000000000000000000000000001" as Address;

		const topics = Abi.Event.encodeTopics(event, { hash });
		const data = Abi.encodeParameters([{ type: "address" }], [user]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.hash).toBeDefined();
		expect(String(decoded.user)).toBe(user);
	});

	it("decodes log with dynamic types in data", () => {
		const event: AbiEvent = {
			type: "event",
			name: "MessageSent",
			inputs: [
				{ type: "address", name: "sender", indexed: true },
				{ type: "string", name: "message", indexed: false },
			],
		};

		const sender = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const message = "Hello, World!";

		const topics = Abi.Event.encodeTopics(event, { sender });
		const data = Abi.encodeParameters([{ type: "string" }], [message]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.sender).toLowerCase()).toBe(sender.toLowerCase());
		expect(decoded.message).toBe(message);
	});

	it("decodes log with bytes in data", () => {
		const event: AbiEvent = {
			type: "event",
			name: "DataStored",
			inputs: [
				{ type: "uint256", name: "id", indexed: true },
				{ type: "bytes", name: "data", indexed: false },
			],
		};

		const id = 42n;
		const data_value = "0x123456789abcdef0";

		const topics = Abi.Event.encodeTopics(event, { id });
		const data = Abi.encodeParameters([{ type: "bytes" }], [data_value]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.id).toBe(id);
		expect(String(decoded.data).toLowerCase()).toBe(data_value.toLowerCase());
	});
});

// ============================================================================
// Anonymous Events
// ============================================================================

describe("Abi.Event - anonymous events", () => {
	it("encodes anonymous event without topic0", () => {
		const event: AbiEvent = {
			type: "event",
			name: "AnonymousEvent",
			anonymous: true,
			inputs: [
				{ type: "address", name: "user", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const user = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const topics = Abi.Event.encodeTopics(event, { user });

		// Anonymous events don't have topic0
		expect(topics.length).toBe(1); // Only the indexed 'user'
		expect(topics[0]?.length).toBe(32);
	});

	it("decodes anonymous event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "AnonymousEvent",
			anonymous: true,
			inputs: [
				{ type: "address", name: "user", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const user = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(event, { user });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.user).toLowerCase()).toBe(user.toLowerCase());
		expect(decoded.value).toBe(value);
	});
});

// ============================================================================
// Complex Event Tests
// ============================================================================

describe("Abi.Event - complex events", () => {
	it("decodes event with tuple in data", () => {
		const event: AbiEvent = {
			type: "event",
			name: "OrderCreated",
			inputs: [
				{ type: "uint256", name: "orderId", indexed: true },
				{
					type: "tuple",
					name: "order",
					indexed: false,
					components: [
						{ type: "address", name: "maker" },
						{ type: "uint256", name: "amount" },
						{ type: "uint256", name: "price" },
					],
				},
			],
		};

		const orderId = 123n;
		const order = ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000n, 500n];

		const topics = Abi.Event.encodeTopics(event, { orderId });
		const data = Abi.encodeParameters(
			[
				{
					type: "tuple",
					components: [
						{ type: "address" },
						{ type: "uint256" },
						{ type: "uint256" },
					],
				},
			],
			[order],
		);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.orderId).toBe(orderId);
		expect(decoded.order).toBeDefined();
	});

	it("decodes event with array in data", () => {
		const event: AbiEvent = {
			type: "event",
			name: "BatchProcessed",
			inputs: [
				{ type: "address", name: "processor", indexed: true },
				{ type: "uint256[]", name: "values", indexed: false },
			],
		};

		const processor = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const values = [1n, 2n, 3n, 4n, 5n];

		const topics = Abi.Event.encodeTopics(event, { processor });
		const data = Abi.encodeParameters([{ type: "uint256[]" }], [values]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.processor).toLowerCase()).toBe(
			processor.toLowerCase(),
		);
		expect(decoded.values).toEqual(values);
	});

	it("decodes event with multiple indexed addresses", () => {
		const event: AbiEvent = {
			type: "event",
			name: "ThreeWayTransfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "address", name: "router", indexed: true },
				{ type: "uint256", name: "amount", indexed: false },
			],
		};

		const from = "0x0000000000000000000000000000000000000001" as Address;
		const to = "0x0000000000000000000000000000000000000002" as Address;
		const router = "0x0000000000000000000000000000000000000003" as Address;
		const amount = 1000n;

		const topics = Abi.Event.encodeTopics(event, { from, to, router });
		const data = Abi.encodeParameters([{ type: "uint256" }], [amount]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(String(decoded.from)).toBe(from);
		expect(String(decoded.to)).toBe(to);
		expect(String(decoded.router)).toBe(router);
		expect(decoded.amount).toBe(amount);
	});
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Abi.Event - edge cases", () => {
	it("handles event with only indexed params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "AllIndexed",
			inputs: [
				{ type: "address", name: "user", indexed: true },
				{ type: "uint256", name: "value", indexed: true },
			],
		};

		const user = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3" as Address;
		const value = 1000n;

		const topics = Abi.Event.encodeTopics(event, { user, value });

		expect(topics.length).toBe(3); // topic0 + 2 indexed
		expect(topics[0]?.length).toBe(32);
		expect(topics[1]?.length).toBe(32);
		expect(topics[2]?.length).toBe(32);
	});

	it("handles event with no params", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Ping",
			inputs: [],
		};

		const topics = Abi.Event.encodeTopics(event, {});

		expect(topics.length).toBe(1); // Only topic0
		expect(topics[0]?.length).toBe(32);
	});

	it("handles zero values in event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const from = "0x0000000000000000000000000000000000000000" as Address;
		const to = "0x0000000000000000000000000000000000000000" as Address;
		const value = 0n;

		const topics = Abi.Event.encodeTopics(event, { from, to });
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.from).toBeDefined();
		expect(decoded.to).toBeDefined();
		expect(decoded.value).toBe(0n);
	});

	it("handles max uint256 in event", () => {
		const event: AbiEvent = {
			type: "event",
			name: "MaxValue",
			inputs: [{ type: "uint256", name: "value", indexed: false }],
		};

		const value =
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

		const topics = Abi.Event.encodeTopics(event, {});
		const data = Abi.encodeParameters([{ type: "uint256" }], [value]);

		const decoded = Abi.Event.decodeLog(event, data, topics as any);

		expect(decoded.value).toBe(value);
	});
});
