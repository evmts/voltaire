/**
 * Tests for docs/primitives/abi/index.mdx
 *
 * Validates that all code examples in the ABI documentation work correctly.
 */
import { describe, expect, it } from "vitest";

describe("Abi Documentation - index.mdx", () => {
	describe("Function Encoding", () => {
		it("should get function selector", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const transferAbi = {
				type: "function",
				name: "transfer",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
				stateMutability: "nonpayable",
			} as const;

			const selector = Abi.Function.getSelector(transferAbi);

			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
			expect(Hex.fromBytes(selector)).toBe("0xa9059cbb");
		});

		it("should encode function parameters", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");
			const { Address } = await import("../../../src/primitives/Address/index.js");

			const transferAbi = {
				type: "function",
				name: "transfer",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
				stateMutability: "nonpayable",
			} as const;

			const encoded = Abi.Function.encodeParams(transferAbi, [
				Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
				1000000000000000000n,
			]);

			expect(encoded).toBeInstanceOf(Uint8Array);
			// selector (4 bytes) + address (32 bytes padded) + uint256 (32 bytes) = 68 bytes
			expect(encoded.length).toBe(68);
		});

		it("should get function signature", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const transferAbi = {
				type: "function",
				name: "transfer",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
				stateMutability: "nonpayable",
			} as const;

			const signature = Abi.Function.getSignature(transferAbi);

			expect(signature).toBe("transfer(address,uint256)");
		});
	});

	describe("Event Encoding", () => {
		it("should get event selector (topic0)", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");
			const { Hex } = await import("../../../src/primitives/Hex/index.js");

			const transferEvent = {
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			} as const;

			const selector = Abi.Event.getSelector(transferEvent);

			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(32);
			// Known Transfer event topic
			expect(Hex.fromBytes(selector)).toBe(
				"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
			);
		});

		it("should get event signature", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const transferEvent = {
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value", indexed: false },
				],
			} as const;

			const signature = Abi.Event.getSignature(transferEvent);

			expect(signature).toBe("Transfer(address,address,uint256)");
		});
	});

	describe("Error Encoding", () => {
		it("should get error selector", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const errorAbi = {
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "balance" },
					{ type: "uint256", name: "required" },
				],
			} as const;

			const selector = Abi.Error.getSelector(errorAbi);

			expect(selector).toBeInstanceOf(Uint8Array);
			expect(selector.length).toBe(4);
		});

		it("should get error signature", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const errorAbi = {
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "balance" },
					{ type: "uint256", name: "required" },
				],
			} as const;

			const signature = Abi.Error.getSignature(errorAbi);

			expect(signature).toBe("InsufficientBalance(uint256,uint256)");
		});
	});

	describe("Type Guards (Abi.Item)", () => {
		it("should have isFunction type guard", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const fnItem = { type: "function", name: "test" };
			const evtItem = { type: "event", name: "Test" };

			// Type guards are under Abi.Item namespace
			expect(Abi.Item.isFunction(fnItem)).toBe(true);
			expect(Abi.Item.isFunction(evtItem)).toBe(false);
		});

		it("should have isEvent type guard", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const fnItem = { type: "function", name: "test" };
			const evtItem = { type: "event", name: "Test" };

			expect(Abi.Item.isEvent(fnItem)).toBe(false);
			expect(Abi.Item.isEvent(evtItem)).toBe(true);
		});

		it("should have isError type guard", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const errItem = { type: "error", name: "Test" };
			const fnItem = { type: "function", name: "test" };

			expect(Abi.Item.isError(errItem)).toBe(true);
			expect(Abi.Item.isError(fnItem)).toBe(false);
		});

		it("should have isConstructor type guard", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const ctorItem = { type: "constructor" };
			const fnItem = { type: "function", name: "test" };

			expect(Abi.Item.isConstructor(ctorItem)).toBe(true);
			expect(Abi.Item.isConstructor(fnItem)).toBe(false);
		});
	});

	describe("ABI Item Lookup", () => {
		it("should get item from ABI by name and type", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const erc20Abi = [
				{
					type: "function",
					name: "transfer",
					inputs: [
						{ type: "address", name: "to" },
						{ type: "uint256", name: "amount" },
					],
					outputs: [{ type: "bool" }],
					stateMutability: "nonpayable",
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
			] as const;

			const transferFn = Abi.getItem(erc20Abi, "transfer", "function");
			expect(transferFn?.name).toBe("transfer");
			expect(transferFn?.type).toBe("function");

			const transferEvt = Abi.getItem(erc20Abi, "Transfer", "event");
			expect(transferEvt?.name).toBe("Transfer");
			expect(transferEvt?.type).toBe("event");
		});
	});

	describe("Formatting", () => {
		it("should format function to human-readable signature", async () => {
			const { Abi } = await import("../../../src/primitives/Abi/index.js");

			const fnAbi = {
				type: "function",
				name: "transfer",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
				stateMutability: "nonpayable",
			} as const;

			const formatted = Abi.format(fnAbi);

			expect(formatted).toContain("transfer");
			expect(formatted).toContain("address");
			expect(formatted).toContain("uint256");
		});
	});
});
