/**
 * TypedProvider Integration Tests
 *
 * Tests demonstrating usage of the strongly-typed provider interface.
 */

import { describe, expect, expectTypeOf, it } from "vitest";
import type { EIP1193EventMap } from "./events/EIP1193Events.js";
import { ProviderRpcError } from "./events/ProviderRpcError.js";
import type { VoltaireRpcSchema } from "./schemas/VoltaireRpcSchema.js";
import type { TypedProvider } from "./TypedProvider.js";

describe("TypedProvider", () => {
	it("provides type-safe request method", async () => {
		// Create a mock typed provider
		const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = {
			request: async ({ method, params }) => {
				if (method === "eth_blockNumber") {
					return "0x1234";
				}
				if (method === "eth_chainId") {
					return "0x1";
				}
				if (method === "eth_accounts") {
					return ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"];
				}
				throw new ProviderRpcError(4200, "Unsupported method");
			},
			on: () => provider,
			removeListener: () => provider,
		};

		// Type-safe request: eth_blockNumber returns string
		const blockNumber = await provider.request({
			method: "eth_blockNumber",
		});
		expect(blockNumber).toBe("0x1234");
		expectTypeOf(blockNumber).toEqualTypeOf<string>();

		// Type-safe request: eth_chainId returns string
		const chainId = await provider.request({
			method: "eth_chainId",
		});
		expect(chainId).toBe("0x1");
		expectTypeOf(chainId).toEqualTypeOf<string>();

		// Type-safe request: eth_accounts returns string[]
		const accounts = await provider.request({
			method: "eth_accounts",
		});
		expect(accounts).toEqual(["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"]);
		expectTypeOf(accounts).toEqualTypeOf<string[]>();
	});

	it("validates parameters at compile time", async () => {
		const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = {
			request: async ({ method, params }) => {
				if (method === "eth_getBalance") {
					return "0x1234567890abcdef";
				}
				if (method === "eth_call") {
					return "0xabcdef";
				}
				throw new ProviderRpcError(4200, "Unsupported method");
			},
			on: () => provider,
			removeListener: () => provider,
		};

		// eth_getBalance requires [address: string, block: string]
		const balance = await provider.request({
			method: "eth_getBalance",
			params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
		});
		expect(balance).toBe("0x1234567890abcdef");
		expectTypeOf(balance).toEqualTypeOf<string>();

		// eth_call requires transaction object and block
		const result = await provider.request({
			method: "eth_call",
			params: [
				{
					to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
					data: "0x12345678",
				},
				"latest",
			],
		});
		expect(result).toBe("0xabcdef");
		expectTypeOf(result).toEqualTypeOf<string>();
	});

	it("supports event listeners with type safety", () => {
		let chainChangedCalled = false;
		let accountsChangedCalled = false;

		const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = {
			request: async () => "0x0",
			on: (event, listener) => {
				if (event === "chainChanged") {
					// Simulate event
					setTimeout(() => listener("0x2"), 0);
					chainChangedCalled = true;
				}
				if (event === "accountsChanged") {
					// Simulate event
					setTimeout(() => listener([]), 0);
					accountsChangedCalled = true;
				}
				return provider;
			},
			removeListener: () => provider,
		};

		// Type-safe event listener for chainChanged
		provider.on("chainChanged", (chainId) => {
			expectTypeOf(chainId).toEqualTypeOf<string>();
			expect(typeof chainId).toBe("string");
		});

		// Type-safe event listener for accountsChanged
		provider.on("accountsChanged", (accounts) => {
			expectTypeOf(accounts).toEqualTypeOf<string[]>();
			expect(Array.isArray(accounts)).toBe(true);
		});

		expect(chainChangedCalled).toBe(true);
		expect(accountsChangedCalled).toBe(true);
	});

	it("supports method chaining for event listeners", () => {
		const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = {
			request: async () => "0x0",
			on: () => provider,
			removeListener: () => provider,
		};

		// Should return provider for chaining
		const result = provider
			.on("chainChanged", () => {})
			.on("accountsChanged", () => {})
			.on("connect", () => {});

		expect(result).toBe(provider);
	});
});
