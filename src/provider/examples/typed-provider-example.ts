/**
 * TypedProvider Example
 *
 * Demonstrates the strongly-typed EIP-1193 provider interface.
 * This is a working example showing type safety at compile time.
 */

import type {
	EIP1193EventMap,
	TypedProvider,
	VoltaireRpcSchema,
} from "../index.js";
import { EIP1193ErrorCode, ProviderRpcError } from "../index.js";

/**
 * Example 1: Creating a mock typed provider
 */
export function createMockProvider(): TypedProvider<
	VoltaireRpcSchema,
	EIP1193EventMap
> {
	const listeners = new Map<string, Set<(...args: any[]) => void>>();

	const provider: TypedProvider<VoltaireRpcSchema, EIP1193EventMap> = {
		request: async ({ method, params }) => {
			// Mock implementation
			switch (method) {
				case "eth_blockNumber":
					return "0x1234" as any;

				case "eth_chainId":
					return "0x1" as any;

				case "eth_accounts":
					return ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"] as any;

				case "eth_getBalance":
					if (!params || params.length < 2) {
						throw new ProviderRpcError(
							EIP1193ErrorCode.Unauthorized,
							"Invalid params",
						);
					}
					return "0x1234567890abcdef" as any;

				case "eth_call":
					if (!params || params.length < 2) {
						throw new ProviderRpcError(
							EIP1193ErrorCode.Unauthorized,
							"Invalid params",
						);
					}
					return "0xabcdef" as any;

				default:
					throw new ProviderRpcError(
						EIP1193ErrorCode.UnsupportedMethod,
						`Method ${method} not supported`,
					);
			}
		},

		on: (event, listener) => {
			if (!listeners.has(event as string)) {
				listeners.set(event as string, new Set());
			}
			listeners.get(event as string)?.add(listener);
			return provider;
		},

		removeListener: (event, listener) => {
			const eventListeners = listeners.get(event as string);
			if (eventListeners) {
				eventListeners.delete(listener);
			}
			return provider;
		},
	};

	return provider;
}

/**
 * Example 2: Type-safe RPC calls
 */
export async function exampleTypeSafeRequests() {
	const provider = createMockProvider();

	// Simple request: eth_blockNumber returns string
	const blockNumber = await provider.request({
		method: "eth_blockNumber",
	});

	// Request with params: eth_getBalance
	const balance = await provider.request({
		method: "eth_getBalance",
		params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
	});

	// Array return type: eth_accounts
	const accounts = await provider.request({
		method: "eth_accounts",
	});

	// Complex params: eth_call
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
}

/**
 * Example 3: Event handling
 */
export function exampleEventHandling() {
	const provider = createMockProvider();

	// Type-safe event listeners
	provider.on("chainChanged", (chainId) => {});

	provider.on("accountsChanged", (accounts) => {
		// accounts is typed as string[]
		if (accounts.length === 0) {
		} else {
		}
	});

	provider.on("connect", ({ chainId }) => {});

	provider.on("disconnect", (error) => {
		// error is typed as ProviderRpcError
		console.error("Disconnected:", error.message, error.code);
	});

	// Method chaining
	provider
		.on("chainChanged", (_chainId) => {})
		.on("accountsChanged", (_accounts) => {});

	return provider;
}

/**
 * Example 4: Error handling
 */
export async function exampleErrorHandling() {
	const provider = createMockProvider();

	try {
		// This will throw because the method doesn't exist
		await provider.request({
			method: "eth_accounts",
		});
	} catch (error) {
		if (error instanceof ProviderRpcError) {
			// Handle specific error codes
			switch (error.code) {
				case EIP1193ErrorCode.UserRejectedRequest:
					break;

				case EIP1193ErrorCode.Unauthorized:
					break;

				case EIP1193ErrorCode.UnsupportedMethod:
					break;

				case EIP1193ErrorCode.Disconnected:
					break;

				default:
					console.error("Unknown error:", error.message);
			}

			// Access error data if available
			if (error.data) {
			}
		} else {
			console.error("Unexpected error:", error);
		}
	}
}

/**
 * Example 5: Working with options
 */
export async function exampleWithOptions() {
	const provider = createMockProvider();

	// Request with retry options
	const blockNumber = await provider.request(
		{
			method: "eth_blockNumber",
		},
		{
			retryCount: 3,
			retryDelay: 1000,
			timeout: 5000,
		},
	);
}

/**
 * Example 6: Compile-time type safety demonstration
 *
 * The following would cause TypeScript compilation errors:
 */
export async function exampleCompileTimeErrors() {
	const provider = createMockProvider();

	// ❌ Error: Invalid method name
	// await provider.request({ method: 'invalid_method' });

	// ❌ Error: Missing required params
	// await provider.request({ method: 'eth_getBalance' });

	// ❌ Error: Wrong param types
	// await provider.request({
	//   method: 'eth_getBalance',
	//   params: [123, true]  // Should be [string, string]
	// });

	// ❌ Error: Invalid event name
	// provider.on('invalidEvent', () => {});

	// ❌ Error: Wrong listener signature
	// provider.on('chainChanged', (accounts: string[]) => {
	//   // chainChanged expects (chainId: string) not accounts
	// });

	// ✅ Correct usage
	await provider.request({
		method: "eth_getBalance",
		params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
	});
}
