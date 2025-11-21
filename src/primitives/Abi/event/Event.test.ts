/**
 * Unit tests for Event namespace
 */

import { describe, expect, it } from "vitest";
import * as Hash from "../../Hash/index.ts";
import * as Hex from "../../Hex/index.js";
import { encodeParameters } from "../Encoding.js";
import { Event } from "./Event.js";

describe("Event namespace", () => {
	describe("getSignature", () => {
		it("is available on Event namespace", () => {
			expect(Event.getSignature).toBeDefined();
			expect(typeof Event.getSignature).toBe("function");
		});

		it("generates signature for event", () => {
			const event = {
				type: "event" as const,
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from" },
					{ type: "address", name: "to" },
					{ type: "uint256", name: "value" },
				],
			};

			const signature = Event.getSignature(event);
			expect(signature).toBe("Transfer(address,address,uint256)");
		});
	});

	describe("getSelector", () => {
		it("is available on Event namespace", () => {
			expect(Event.getSelector).toBeDefined();
			expect(typeof Event.getSelector).toBe("function");
		});

		it("computes selector for event", () => {
			const event = {
				type: "event" as const,
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			};

			const selector = Event.getSelector(event);
			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(32);
		});
	});

	describe("encodeTopics", () => {
		it("is available on Event namespace", () => {
			expect(Event.encodeTopics).toBeDefined();
			expect(typeof Event.encodeTopics).toBe("function");
		});

		it("encodes topics for event", () => {
			const event = {
				type: "event" as const,
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			};

			const topics = Event.encodeTopics(event, {
				from: "0x0000000000000000000000000000000000000001",
				to: "0x0000000000000000000000000000000000000002",
			});

			expect(topics.length).toBe(3);
			expect(topics[0]).toBeInstanceOf(Uint8Array);
		});
	});

	describe("decodeLog", () => {
		it("is available on Event namespace", () => {
			expect(Event.decodeLog).toBeDefined();
			expect(typeof Event.decodeLog).toBe("function");
		});

		it("decodes event log", () => {
			const event = {
				type: "event" as const,
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			};

			const selector = Hash.keccak256String(
				"Transfer(address,address,uint256)",
			);

			const fromTopic = new Uint8Array(32);
			fromTopic[31] = 1;

			const toTopic = new Uint8Array(32);
			toTopic[31] = 2;

			const data = encodeParameters(
				[{ type: "uint256", name: "value" }],
				[1000n],
			);

			const result = Event.decodeLog(event, data, [
				selector,
				fromTopic,
				toTopic,
			]);

			expect(result.value).toBe(1000n);
			expect(result.from).toBeDefined();
			expect(result.to).toBeDefined();
		});
	});

	describe("constructor-style aliases", () => {
		it("provides Signature alias", () => {
			expect(Event.Signature).toBeDefined();
			expect(Event.Signature).toBe(Event.getSignature);
		});

		it("provides Topics alias", () => {
			expect(Event.Topics).toBeDefined();
			expect(Event.Topics).toBe(Event.encodeTopics);
		});

		it("provides DecodeLog alias", () => {
			expect(Event.DecodeLog).toBeDefined();
			expect(Event.DecodeLog).toBe(Event.decodeLog);
		});
	});

	describe("factory exports", () => {
		it("provides GetSelector factory", () => {
			expect(Event.GetSelector).toBeDefined();
			expect(typeof Event.GetSelector).toBe("function");
		});

		it("provides EncodeTopics factory", () => {
			expect(Event.EncodeTopics).toBeDefined();
			expect(typeof Event.EncodeTopics).toBe("function");
		});
	});

	describe("integration", () => {
		it("can use all methods together for event workflow", () => {
			const event = {
				type: "event" as const,
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			};

			// Get signature
			const signature = Event.getSignature(event);
			expect(signature).toBe("Transfer(address,address,uint256)");

			// Get selector
			const selector = Event.getSelector(event);
			expect(selector).toBeInstanceOf(Uint8Array);

			// Encode topics
			const topics = Event.encodeTopics(event, {
				from: "0x0000000000000000000000000000000000000001",
				to: "0x0000000000000000000000000000000000000002",
			});
			expect(topics[0]).toEqual(selector);

			// Decode log
			const data = encodeParameters(
				[{ type: "uint256", name: "value" }],
				[1000n],
			);
			const decoded = Event.decodeLog(event, data, topics as any);
			expect(decoded.value).toBe(1000n);
		});

		it("handles anonymous event workflow", () => {
			const event = {
				type: "event" as const,
				name: "Log",
				anonymous: true,
				inputs: [
					{ type: "bytes32", name: "data", indexed: true },
					{ type: "uint256", name: "value" },
				],
			};

			const topics = Event.encodeTopics(event, {
				data: Hex.from(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
			});

			// Anonymous events don't include selector
			expect(topics.length).toBe(1);

			const logData = encodeParameters(
				[{ type: "uint256", name: "value" }],
				[42n],
			);

			const decoded = Event.decodeLog(event, logData, topics as any);
			expect(decoded.value).toBe(42n);
		});

		it("round-trip encode and decode", () => {
			const event = {
				type: "event" as const,
				name: "ValueChanged",
				inputs: [
					{ type: "uint256", name: "oldValue", indexed: true },
					{ type: "uint256", name: "newValue", indexed: true },
					{ type: "address", name: "changer" },
				],
			};

			const originalArgs = {
				oldValue: 100n,
				newValue: 200n,
				changer: "0x0000000000000000000000000000000000000001",
			};

			// Encode
			const topics = Event.encodeTopics(event, originalArgs);
			const data = encodeParameters(
				[{ type: "address", name: "changer" }],
				[originalArgs.changer],
			);

			// Decode
			const decoded = Event.decodeLog(event, data, topics as any);

			expect(decoded.oldValue).toBe(originalArgs.oldValue);
			expect(decoded.newValue).toBe(originalArgs.newValue);
			expect(decoded.changer).toBeDefined();
		});
	});
});
