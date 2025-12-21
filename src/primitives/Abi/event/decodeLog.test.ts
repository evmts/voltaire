/**
 * Unit tests for decodeLog function
 */

import { describe, expect, it } from "vitest";
import * as Hash from "../../Hash/index.ts";
import { Hex, fromBytes as hexFromBytes, toBytes as hexToBytes } from "../../Hex/index.js";
import { encodeParameters } from "../Encoding.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../Errors.js";
import { decodeLog } from "./decodeLog.js";

describe("decodeLog", () => {
	it("decodes Transfer event log", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		// Transfer event selector
		const selector = new Uint8Array([
			0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68,
			0xfc, 0x37, 0x8d, 0xaa, 0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
			0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
		]);

		const fromTopic = new Uint8Array(32);
		fromTopic[31] = 1; // address 0x...001

		const toTopic = new Uint8Array(32);
		toTopic[31] = 2; // address 0x...002

		const data = encodeParameters(
			[{ type: "uint256", name: "value" }],
			[1000n],
		);

		const result = decodeLog(event, data, [selector, fromTopic, toTopic]);

		expect(result.value).toBe(1000n);
		expect(result.from).toBeDefined();
		expect(result.to).toBeDefined();
	});

	it("decodes anonymous event without selector check", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			anonymous: true,
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const fromTopic = new Uint8Array(32);
		fromTopic[31] = 1;

		const toTopic = new Uint8Array(32);
		toTopic[31] = 2;

		const data = encodeParameters(
			[{ type: "uint256", name: "value" }],
			[1000n],
		);

		const result = decodeLog(event, data, [fromTopic, toTopic]);

		expect(result.value).toBe(1000n);
		expect(result.from).toBeDefined();
		expect(result.to).toBeDefined();
	});

	it("throws AbiDecodingError when topics missing for non-anonymous event", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [{ type: "address", name: "from", indexed: true }],
		};

		const data = new Uint8Array(0);

		expect(() => decodeLog(event, data, [])).toThrow(AbiDecodingError);
		expect(() => decodeLog(event, data, [])).toThrow(
			"Missing topic0 for non-anonymous event",
		);
	});

	it("throws AbiInvalidSelectorError when selector doesn't match", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [{ type: "address", name: "from", indexed: true }],
		};

		const wrongSelector = new Uint8Array(32); // all zeros
		const data = new Uint8Array(0);

		expect(() => decodeLog(event, data, [wrongSelector])).toThrow(
			AbiInvalidSelectorError,
		);
		expect(() => decodeLog(event, data, [wrongSelector])).toThrow(
			"Event selector mismatch",
		);
	});

	it("throws AbiDecodingError when indexed topic is missing", () => {
		const event = {
			type: "event" as const,
			name: "Transfer",
			inputs: [
				{ type: "address", name: "from", indexed: true },
				{ type: "address", name: "to", indexed: true },
			],
		};

		const selector = Hash.keccak256String("Transfer(address,address)");
		const fromTopic = new Uint8Array(32);

		const data = new Uint8Array(0);

		// Only 2 topics when 3 are needed (selector + from + to)
		expect(() => decodeLog(event, data, [selector, fromTopic])).toThrow(
			AbiDecodingError,
		);
		expect(() => decodeLog(event, data, [selector, fromTopic])).toThrow(
			"Missing topic for indexed parameter",
		);
	});

	it("decodes event with only non-indexed parameters", () => {
		const event = {
			type: "event" as const,
			name: "Log",
			inputs: [
				{ type: "string", name: "message", indexed: false },
				{ type: "uint256", name: "value", indexed: false },
			],
		};

		const selector = Hash.keccak256String("Log(string,uint256)");
		const data = encodeParameters(
			[
				{ type: "string", name: "message" },
				{ type: "uint256", name: "value" },
			],
			["hello", 42n],
		);

		const result = decodeLog(event, data, [selector]);

		expect(result.message).toBe("hello");
		expect(result.value).toBe(42n);
	});

	it("decodes event with mixed indexed and non-indexed parameters", () => {
		const event = {
			type: "event" as const,
			name: "Swap",
			inputs: [
				{ type: "address", name: "sender", indexed: true },
				{ type: "uint256", name: "amount0In", indexed: false },
				{ type: "uint256", name: "amount1In", indexed: false },
				{ type: "uint256", name: "amount0Out", indexed: false },
				{ type: "uint256", name: "amount1Out", indexed: false },
				{ type: "address", name: "to", indexed: true },
			],
		};

		const selector = Hash.keccak256String(
			"Swap(address,uint256,uint256,uint256,uint256,address)",
		);

		const senderTopic = new Uint8Array(32);
		senderTopic[31] = 1;

		const toTopic = new Uint8Array(32);
		toTopic[31] = 2;

		const data = encodeParameters(
			[
				{ type: "uint256", name: "amount0In" },
				{ type: "uint256", name: "amount1In" },
				{ type: "uint256", name: "amount0Out" },
				{ type: "uint256", name: "amount1Out" },
			],
			[100n, 200n, 300n, 400n],
		);

		const result = decodeLog(event, data, [selector, senderTopic, toTopic]);

		expect(result.sender).toBeDefined();
		expect(result.amount0In).toBe(100n);
		expect(result.amount1In).toBe(200n);
		expect(result.amount0Out).toBe(300n);
		expect(result.amount1Out).toBe(400n);
		expect(result.to).toBeDefined();
	});

	it("decodes indexed dynamic types as hashed values", () => {
		const event = {
			type: "event" as const,
			name: "Message",
			inputs: [{ type: "string", name: "text", indexed: true }],
		};

		const selector = Hash.keccak256String("Message(string)");
		const hashedText = Hash.keccak256String("hello");

		const data = new Uint8Array(0);

		const result = decodeLog(event, data, [selector, hashedText]);

		// Dynamic indexed types return the hash, not the original value
		expect(result.text).toBeInstanceOf(Uint8Array);
		expect(result.text).toEqual(hashedText);
	});

	it("decodes indexed static types as original values", () => {
		const event = {
			type: "event" as const,
			name: "ValueChanged",
			inputs: [
				{ type: "uint256", name: "oldValue", indexed: true },
				{ type: "uint256", name: "newValue", indexed: true },
			],
		};

		const selector = Hash.keccak256String("ValueChanged(uint256,uint256)");

		const oldValueTopic = new Uint8Array(32);
		oldValueTopic[31] = 10;

		const newValueTopic = new Uint8Array(32);
		newValueTopic[31] = 20;

		const data = new Uint8Array(0);

		const result = decodeLog(event, data, [
			selector,
			oldValueTopic,
			newValueTopic,
		]);

		expect(result.oldValue).toBe(10n);
		expect(result.newValue).toBe(20n);
	});

	it("decodes bool type", () => {
		const event = {
			type: "event" as const,
			name: "FlagChanged",
			inputs: [{ type: "bool", name: "flag", indexed: false }],
		};

		const selector = Hash.keccak256String("FlagChanged(bool)");
		const data = encodeParameters([{ type: "bool", name: "flag" }], [true]);

		const result = decodeLog(event, data, [selector]);

		expect(result.flag).toBe(true);
	});

	it("decodes bytes type", () => {
		const event = {
			type: "event" as const,
			name: "Data",
			inputs: [{ type: "bytes", name: "data", indexed: false }],
		};

		const selector = Hash.keccak256String("Data(bytes)");
		const bytesData = Hex("0x123456");
		const data = encodeParameters(
			[{ type: "bytes", name: "data" }],
			[bytesData],
		);

		const result = decodeLog(event, data, [selector]);

		expect(result.data).toBeInstanceOf(Uint8Array);
		expect(hexFromBytes(result.data)).toBe("0x123456");
	});

	it("decodes array type", () => {
		const event = {
			type: "event" as const,
			name: "Values",
			inputs: [{ type: "uint256[]", name: "values", indexed: false }],
		};

		const selector = Hash.keccak256String("Values(uint256[])");
		const data = encodeParameters(
			[{ type: "uint256[]", name: "values" }],
			[[1n, 2n, 3n]],
		);

		const result = decodeLog(event, data, [selector]);

		expect(result.values).toEqual([1n, 2n, 3n]);
	});

	it("handles parameters without names", () => {
		const event = {
			type: "event" as const,
			name: "Unnamed",
			inputs: [
				{ type: "uint256", indexed: true },
				{ type: "address", indexed: false },
			],
		};

		const selector = Hash.keccak256String("Unnamed(uint256,address)");

		const valueTopic = new Uint8Array(32);
		valueTopic[31] = 42;

		const addressData = new Uint8Array(32);
		addressData[31] = 1;

		const result = decodeLog(event, addressData, [selector, valueTopic]);

		// Parameters without names shouldn't be in result object
		expect(Object.keys(result).length).toBe(0);
	});

	it("decodes event with no parameters", () => {
		const event = {
			type: "event" as const,
			name: "Ping",
			inputs: [],
		};

		const selector = Hash.keccak256String("Ping()");
		const data = new Uint8Array(0);

		const result = decodeLog(event, data, [selector]);

		expect(result).toEqual({});
	});

	it("decodes indexed bytes32", () => {
		const event = {
			type: "event" as const,
			name: "HashSet",
			inputs: [{ type: "bytes32", name: "hash", indexed: true }],
		};

		const selector = Hash.keccak256String("HashSet(bytes32)");
		const hashTopic = hexToBytes(
			Hex("0x0000000000000000000000000000000000000000000000000000000000000001"),
		);

		const data = new Uint8Array(0);

		const result = decodeLog(event, data, [selector, hashTopic]);

		expect(result.hash).toBeInstanceOf(Uint8Array);
		expect(result.hash).toEqual(hashTopic);
	});

	it("handles multiple non-indexed parameters of different types", () => {
		const event = {
			type: "event" as const,
			name: "ComplexEvent",
			inputs: [
				{ type: "uint256", name: "a", indexed: false },
				{ type: "address", name: "b", indexed: false },
				{ type: "bool", name: "c", indexed: false },
				{ type: "bytes32", name: "d", indexed: false },
			],
		};

		const selector = Hash.keccak256String(
			"ComplexEvent(uint256,address,bool,bytes32)",
		);

		// Address is 20 bytes
		const addressBytes = new Uint8Array(20);
		addressBytes[19] = 1;

		// bytes32 should be a Uint8Array
		const hashBytes = hexToBytes(
			Hex("0x0000000000000000000000000000000000000000000000000000000000000002"),
		);

		const data = encodeParameters(
			[
				{ type: "uint256", name: "a" },
				{ type: "address", name: "b" },
				{ type: "bool", name: "c" },
				{ type: "bytes32", name: "d" },
			],
			[42n, addressBytes, true, hashBytes],
		);

		const result = decodeLog(event, data, [selector]);

		expect(result.a).toBe(42n);
		expect(typeof result.b).toBe("string"); // Address decoded as hex string
		expect(result.c).toBe(true);
		expect(result.d).toBeInstanceOf(Uint8Array);
	});
});
