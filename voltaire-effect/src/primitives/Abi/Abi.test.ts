import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "@effect/vitest";
import { parse, AbiParseError } from "./parse.js";
import { encodeFunctionData } from "./encodeFunctionData.js";
import { decodeFunctionData } from "./decodeFunctionData.js";
import { decodeEventLog } from "./decodeEventLog.js";
import { encodeEventLog } from "./encodeEventLog.js";

const erc20Abi = [
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ type: "bool" }],
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ type: "uint256" }],
	},
	{
		type: "event",
		name: "Transfer",
		inputs: [
			{ name: "from", type: "address", indexed: true },
			{ name: "to", type: "address", indexed: true },
			{ name: "value", type: "uint256", indexed: false },
		],
	},
] as const;

describe("parse", () => {
	it.effect("parses valid JSON ABI string", () =>
		Effect.gen(function* () {
			const jsonString = JSON.stringify(erc20Abi);
			const abi = yield* parse(jsonString);
			expect(Array.isArray(abi)).toBe(true);
			expect(abi.length).toBe(3);
		}),
	);

	it.effect("fails with AbiParseError on invalid JSON", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(parse("not valid json {{{"));
			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				expect(error._tag).toBe("Fail");
			}
		}),
	);

	it.effect("parses empty array as valid ABI", () =>
		Effect.gen(function* () {
			const abi = yield* parse("[]");
			expect(Array.isArray(abi)).toBe(true);
			expect(abi.length).toBe(0);
		}),
	);
});

describe("encodeFunctionData", () => {
	const transferSelector = "0xa9059cbb";

	it.effect("encodes transfer correctly with known selector", () =>
		Effect.gen(function* () {
			const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				1000000000000000000n,
			]);
			expect(calldata.startsWith(transferSelector)).toBe(true);
			expect(calldata.length).toBe(138);
		}),
	);

	it.effect("fails with AbiItemNotFoundError for unknown function", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				encodeFunctionData(erc20Abi, "unknownFunction", []),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);

	it.effect("fails with AbiEncodingError for wrong argument types", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				encodeFunctionData(erc20Abi, "transfer", [
					"not an address",
					"not a uint",
				]),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);
});

describe("decodeFunctionData", () => {
	it.effect("decodes known calldata correctly", () =>
		Effect.gen(function* () {
			const calldata = yield* encodeFunctionData(erc20Abi, "transfer", [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				1000000000000000000n,
			]);
			const decoded = yield* decodeFunctionData(erc20Abi, calldata);
			expect(decoded.name).toBe("transfer");
			expect(decoded.params.length).toBe(2);
			expect((decoded.params[0] as string).toLowerCase()).toBe(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			expect(decoded.params[1]).toBe(1000000000000000000n);
		}),
	);

	it.effect("fails on invalid selector", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				decodeFunctionData(erc20Abi, "0xdeadbeef" as `0x${string}`),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);

	it.effect("fails on calldata too short", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				decodeFunctionData(erc20Abi, "0x12" as `0x${string}`),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);
});

describe("encodeEventLog", () => {
	it.effect("encodes Transfer event topics", () =>
		Effect.gen(function* () {
			const topics = yield* encodeEventLog(erc20Abi, "Transfer", [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				"0x1234567890123456789012345678901234567890",
			]);
			expect(topics.length).toBe(3);
			expect(topics[0].startsWith("0x")).toBe(true);
		}),
	);

	it.effect("fails for unknown event", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				encodeEventLog(erc20Abi, "UnknownEvent", []),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);
});

describe("decodeEventLog", () => {
	it.effect("decodes Transfer event log", () =>
		Effect.gen(function* () {
			const topics = yield* encodeEventLog(erc20Abi, "Transfer", [
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
				"0x1234567890123456789012345678901234567890",
			]);
			const value = 1000000000000000000n;
			const data = `0x${value.toString(16).padStart(64, "0")}` as `0x${string}`;
			const decoded = yield* decodeEventLog(erc20Abi, { data, topics });
			expect(decoded.event).toBe("Transfer");
			expect(decoded.params.value).toBe(value);
		}),
	);

	it.effect("fails for unknown event signature", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				decodeEventLog(erc20Abi, {
					data: "0x" as `0x${string}`,
					topics: ["0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" as `0x${string}`],
				}),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		}),
	);
});
