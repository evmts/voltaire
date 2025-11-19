/**
 * WebSocketProvider Tests - EIP-1193 Compliant
 *
 * Tests WebSocketProvider implementation:
 * - request() method instead of individual methods
 * - EventEmitter pattern (on, removeListener, emit)
 * - Real-time events via WebSocket subscriptions
 * - EIP-1193 standard events (connect, disconnect, chainChanged, etc)
 * - Throws errors instead of Response<T> unions
 *
 * NOTE: These tests are currently SKIPPED as they test the future EIP-1193
 * compliant interface. Current WebSocketProvider uses individual methods and
 * Response<T> unions. These tests will be enabled when the implementation
 * is migrated to EIP-1193.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { WebSocketProvider } from "./WebSocketProvider.js";

// Mock WebSocket
class MockWebSocket {
	onopen: ((event: any) => void) | null = null;
	onmessage: ((event: any) => void) | null = null;
	onerror: ((event: any) => void) | null = null;
	onclose: ((event: any) => void) | null = null;
	readyState = 1; // OPEN

	constructor(
		public url: string,
		public protocols?: string | string[],
	) {
		setTimeout(() => this.onopen?.({}), 0);
	}

	send(data: string) {
		// Mock send
	}

	close() {
		this.readyState = 3; // CLOSED
		setTimeout(() => this.onclose?.({ code: 1000, reason: "" }), 0);
	}
}

describe.skip("WebSocketProvider - EIP-1193 (Future Implementation)", () => {
	let provider: WebSocketProvider;
	const mockUrl = "wss://localhost:8546";

	beforeEach(() => {
		global.WebSocket = MockWebSocket as any;
		provider = new WebSocketProvider(mockUrl);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("request() method", () => {
		it("executes eth_blockNumber via request()", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0x1234",
					}),
				});
			}, 0);

			const result = await provider.request({
				method: "eth_blockNumber",
			});

			expect(result).toBe("0x1234");
		});

		it("executes eth_getBalance via request() with params", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0xde0b6b3a7640000",
					}),
				});
			}, 0);

			const result = await provider.request({
				method: "eth_getBalance",
				params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0", "latest"],
			});

			expect(result).toBe("0xde0b6b3a7640000");
		});

		it("accepts RequestArguments interface", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0x1",
					}),
				});
			}, 0);

			const args = {
				method: "eth_chainId" as const,
			};

			const result = await provider.request(args);
			expect(result).toBe("0x1");
		});

		it("sends correct JSON-RPC 2.0 format", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0x0",
					}),
				});
			}, 0);

			await provider.request({ method: "eth_chainId" });

			const sent = JSON.parse(sendSpy.mock.calls[0][0]);
			expect(sent).toHaveProperty("jsonrpc", "2.0");
			expect(sent).toHaveProperty("id");
			expect(sent).toHaveProperty("method", "eth_chainId");
			expect(sent).toHaveProperty("params");
		});
	});

	describe("Error Handling - Throws Instead of Response Union", () => {
		it("throws on JSON-RPC error response", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						error: {
							code: -32601,
							message: "Method not found",
						},
					}),
				});
			}, 0);

			await expect(
				provider.request({ method: "eth_unknown" }),
			).rejects.toMatchObject({
				code: -32601,
				message: "Method not found",
			});
		});

		it("throws with EIP-1193 error codes", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						error: {
							code: 4200,
							message: "Unsupported method",
						},
					}),
				});
			}, 0);

			await expect(
				provider.request({ method: "eth_customMethod" }),
			).rejects.toMatchObject({
				code: 4200,
				message: "Unsupported method",
			});
		});

		it("does NOT return Response<T> union", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0x1234",
					}),
				});
			}, 0);

			const result = await provider.request({ method: "eth_blockNumber" });

			expect(result).toBe("0x1234");
			expect(result).not.toHaveProperty("error");
			expect(result).not.toHaveProperty("result");
		});
	});

	describe("EventEmitter Interface", () => {
		it("has on() method", () => {
			expect(provider.on).toBeDefined();
			expect(typeof provider.on).toBe("function");
		});

		it("has removeListener() method", () => {
			expect(provider.removeListener).toBeDefined();
			expect(typeof provider.removeListener).toBe("function");
		});

		it("on() returns provider for chaining", () => {
			const listener = vi.fn();
			const result = provider.on("chainChanged", listener);

			expect(result).toBe(provider);
		});

		it("removeListener() returns provider for chaining", () => {
			const listener = vi.fn();
			const result = provider.removeListener("chainChanged", listener);

			expect(result).toBe(provider);
		});

		it("emits connect event on successful connection", async () => {
			const listener = vi.fn();
			provider.on("connect", listener);

			await provider.connect();

			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					chainId: expect.any(String),
				}),
			);
		});

		it("emits disconnect event on connection close", async () => {
			await provider.connect();

			const listener = vi.fn();
			provider.on("disconnect", listener);

			provider.disconnect();

			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(listener).toHaveBeenCalled();
		});

		it("emits chainChanged event when chain changes", async () => {
			await provider.connect();

			const listener = vi.fn();
			provider.on("chainChanged", listener);

			const ws = (provider as any).ws as MockWebSocket;
			ws.onmessage?.({
				data: JSON.stringify({
					method: "eth_subscription",
					params: {
						subscription: "chain_changed",
						result: "0x89",
					},
				}),
			});

			expect(listener).toHaveBeenCalledWith("0x89");
		});

		it("emits accountsChanged event when accounts change", async () => {
			await provider.connect();

			const listener = vi.fn();
			provider.on("accountsChanged", listener);

			const ws = (provider as any).ws as MockWebSocket;
			ws.onmessage?.({
				data: JSON.stringify({
					method: "eth_subscription",
					params: {
						subscription: "accounts_changed",
						result: ["0x123", "0x456"],
					},
				}),
			});

			expect(listener).toHaveBeenCalledWith(["0x123", "0x456"]);
		});

		it("emits message event for subscription notifications", async () => {
			await provider.connect();

			const listener = vi.fn();
			provider.on("message", listener);

			const ws = (provider as any).ws as MockWebSocket;
			ws.onmessage?.({
				data: JSON.stringify({
					method: "eth_subscription",
					params: {
						subscription: "0xabc123",
						result: { number: "0x1234" },
					},
				}),
			});

			expect(listener).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "eth_subscription",
					data: expect.any(Object),
				}),
			);
		});

		it("removes event listeners", async () => {
			const listener = vi.fn();

			provider.on("chainChanged", listener);
			provider.removeListener("chainChanged", listener);

			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			ws.onmessage?.({
				data: JSON.stringify({
					method: "eth_subscription",
					params: {
						subscription: "chain_changed",
						result: "0x1",
					},
				}),
			});

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("Standard EIP-1193 Events", () => {
		it("supports connect event", () => {
			const listener = vi.fn();
			provider.on("connect", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports disconnect event", () => {
			const listener = vi.fn();
			provider.on("disconnect", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports chainChanged event", () => {
			const listener = vi.fn();
			provider.on("chainChanged", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports accountsChanged event", () => {
			const listener = vi.fn();
			provider.on("accountsChanged", listener);

			expect(listener).not.toHaveBeenCalled();
		});

		it("supports message event", () => {
			const listener = vi.fn();
			provider.on("message", listener);

			expect(listener).not.toHaveBeenCalled();
		});
	});

	describe("WebSocket Subscriptions", () => {
		it("subscribes to newHeads via eth_subscribe", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: "0xsub123",
					}),
				});
			}, 0);

			const subscriptionId = await provider.request({
				method: "eth_subscribe",
				params: ["newHeads"],
			});

			expect(subscriptionId).toBe("0xsub123");
		});

		it("receives subscription notifications", async () => {
			await provider.connect();

			const listener = vi.fn();
			provider.on("message", listener);

			const ws = (provider as any).ws as MockWebSocket;

			ws.onmessage?.({
				data: JSON.stringify({
					method: "eth_subscription",
					params: {
						subscription: "0xabc",
						result: {
							number: "0x1234",
							hash: "0xabcd",
						},
					},
				}),
			});

			expect(listener).toHaveBeenCalled();
		});

		it("unsubscribes via eth_unsubscribe", async () => {
			await provider.connect();

			const ws = (provider as any).ws as MockWebSocket;
			const sendSpy = vi.spyOn(ws, "send");

			setTimeout(() => {
				const message = JSON.parse(sendSpy.mock.calls[0][0]);
				ws.onmessage?.({
					data: JSON.stringify({
						jsonrpc: "2.0",
						id: message.id,
						result: true,
					}),
				});
			}, 0);

			const result = await provider.request({
				method: "eth_unsubscribe",
				params: ["0xsub123"],
			});

			expect(result).toBe(true);
		});
	});

	describe("Connection Management", () => {
		it("connects successfully", async () => {
			await expect(provider.connect()).resolves.toBeUndefined();
		});

		it("disconnects successfully", async () => {
			await provider.connect();
			provider.disconnect();

			expect((provider as any).ws?.readyState).toBe(3); // CLOSED
		});

		it("reconnects automatically on disconnect", async () => {
			const p = new WebSocketProvider({
				url: mockUrl,
				reconnect: true,
				reconnectDelay: 10,
			});

			await p.connect();

			const ws = (p as any).ws as MockWebSocket;
			ws.onclose?.({ code: 1006, reason: "Abnormal close" });

			await new Promise((resolve) => setTimeout(resolve, 20));

			expect((p as any).reconnectAttempts).toBeGreaterThan(0);
		});

		it("respects maxReconnectAttempts", async () => {
			const p = new WebSocketProvider({
				url: mockUrl,
				reconnect: true,
				reconnectDelay: 10,
				maxReconnectAttempts: 2,
			});

			await p.connect();

			const ws = (p as any).ws as MockWebSocket;
			ws.onclose?.({ code: 1006, reason: "Abnormal close" });

			await new Promise((resolve) => setTimeout(resolve, 50));

			expect((p as any).reconnectAttempts).toBeLessThanOrEqual(2);
		});
	});

	describe("Constructor Options", () => {
		it("accepts string URL", () => {
			const p = new WebSocketProvider("wss://eth.example.com");
			expect(p).toBeDefined();
		});

		it("accepts options object", () => {
			const p = new WebSocketProvider({
				url: "wss://eth.example.com",
				reconnect: false,
				protocols: ["wss"],
			});
			expect(p).toBeDefined();
		});

		it("applies custom reconnect settings", () => {
			const p = new WebSocketProvider({
				url: mockUrl,
				reconnect: false,
				reconnectDelay: 1000,
				maxReconnectAttempts: 5,
			});

			expect((p as any).reconnect).toBe(false);
			expect((p as any).reconnectDelay).toBe(1000);
			expect((p as any).maxReconnectAttempts).toBe(5);
		});
	});

	describe("Method Coverage", () => {
		it("supports all eth namespace methods via request()", async () => {
			await provider.connect();

			const methods = [
				"eth_accounts",
				"eth_blockNumber",
				"eth_chainId",
				"eth_getBalance",
			];

			for (const method of methods) {
				const ws = (provider as any).ws as MockWebSocket;
				const sendSpy = vi.spyOn(ws, "send");

				setTimeout(() => {
					const message = JSON.parse(sendSpy.mock.calls[0][0]);
					ws.onmessage?.({
						data: JSON.stringify({
							jsonrpc: "2.0",
							id: message.id,
							result: "0x0",
						}),
					});
				}, 0);

				await provider.request({ method });

				const sent = JSON.parse(sendSpy.mock.calls[0][0]);
				expect(sent.method).toBe(method);
			}
		});
	});
});
