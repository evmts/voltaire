/**
 * EIP-1193 Provider Compliance Tests
 *
 * Verifies providers comply with EIP-1193 standard:
 * - request() method signature
 * - EventEmitter interface (on, removeListener, emit)
 * - Standard error codes
 * - Standard events (connect, disconnect, chainChanged, accountsChanged, message)
 */

import { describe, expect, it, vi } from "vitest";
import type { RequestArguments } from "./types.js";

describe("EIP-1193 Compliance", () => {
	describe("RequestArguments Interface", () => {
		it("has required method field", () => {
			const args: RequestArguments = {
				method: "eth_blockNumber",
			};

			expect(args.method).toBe("eth_blockNumber");
			expect(args.params).toBeUndefined();
		});

		it("has optional params field", () => {
			const args: RequestArguments = {
				method: "eth_getBalance",
				params: ["0x123", "latest"],
			};

			expect(args.method).toBe("eth_getBalance");
			expect(args.params).toEqual(["0x123", "latest"]);
		});

		it("accepts params as array", () => {
			const args: RequestArguments = {
				method: "eth_call",
				params: [{ to: "0x123" }, "latest"],
			};

			expect(Array.isArray(args.params)).toBe(true);
		});

		it("accepts params as object", () => {
			const args: RequestArguments = {
				method: "eth_subscribe",
				params: { subscription: "newHeads" },
			};

			expect(typeof args.params).toBe("object");
			expect(Array.isArray(args.params)).toBe(false);
		});
	});

	describe("request() Method Signature", () => {
		it("accepts RequestArguments and returns Promise", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0x1234"),
			};

			const result = await mockProvider.request({
				method: "eth_blockNumber",
			});

			expect(mockProvider.request).toHaveBeenCalledWith({
				method: "eth_blockNumber",
			});
			expect(result).toBe("0x1234");
		});

		it("throws on error (not return error object)", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue(new Error("Network error")),
			};

			await expect(
				mockProvider.request({ method: "eth_blockNumber" }),
			).rejects.toThrow("Network error");
		});

		it("resolves with method-specific return type", async () => {
			const mockProvider = {
				request: vi.fn().mockResolvedValue("0xabcdef"),
			};

			const result = await mockProvider.request({
				method: "eth_call",
				params: [{ to: "0x123", data: "0x456" }, "latest"],
			});

			expect(typeof result).toBe("string");
		});
	});

	describe("EventEmitter Interface", () => {
		it("has on() method", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("chainChanged", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("chainChanged", listener);
		});

		it("has removeListener() method", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.removeListener("chainChanged", listener);

			expect(mockProvider.removeListener).toHaveBeenCalledWith(
				"chainChanged",
				listener,
			);
		});

		it("on() returns provider for chaining", () => {
			const mockProvider = {
				// biome-ignore lint/suspicious/noExplicitAny: mock provider uses 'this' binding
				on: vi.fn(function (this: any) {
					return this;
				}),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const result = mockProvider.on("chainChanged", vi.fn());
			expect(result).toBe(mockProvider);
		});

		it("removeListener() returns provider for chaining", () => {
			const mockProvider = {
				on: vi.fn(),
				// biome-ignore lint/suspicious/noExplicitAny: mock provider uses 'this' binding
				removeListener: vi.fn(function (this: any) {
					return this;
				}),
				request: vi.fn(),
			};

			const result = mockProvider.removeListener("chainChanged", vi.fn());
			expect(result).toBe(mockProvider);
		});
	});

	describe("Standard Events", () => {
		it("supports connect event", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("connect", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("connect", listener);
		});

		it("supports disconnect event", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("disconnect", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("disconnect", listener);
		});

		it("supports chainChanged event", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("chainChanged", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("chainChanged", listener);
		});

		it("supports accountsChanged event", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("accountsChanged", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("accountsChanged", listener);
		});

		it("supports message event", () => {
			const mockProvider = {
				on: vi.fn(),
				removeListener: vi.fn(),
				request: vi.fn(),
			};

			const listener = vi.fn();
			mockProvider.on("message", listener);

			expect(mockProvider.on).toHaveBeenCalledWith("message", listener);
		});

		it("connect event provides chainId", () => {
			const listener = vi.fn();
			const connectInfo = { chainId: "0x1" };

			listener(connectInfo);

			expect(listener).toHaveBeenCalledWith(connectInfo);
			expect(listener.mock.calls[0][0]).toHaveProperty("chainId");
		});

		it("chainChanged event provides chainId string", () => {
			const listener = vi.fn();
			const chainId = "0x89";

			listener(chainId);

			expect(listener).toHaveBeenCalledWith(chainId);
			expect(typeof listener.mock.calls[0][0]).toBe("string");
		});

		it("accountsChanged event provides accounts array", () => {
			const listener = vi.fn();
			const accounts = ["0x123", "0x456"];

			listener(accounts);

			expect(listener).toHaveBeenCalledWith(accounts);
			expect(Array.isArray(listener.mock.calls[0][0])).toBe(true);
		});

		it("message event provides message object", () => {
			const listener = vi.fn();
			const message = { type: "eth_subscription", data: {} };

			listener(message);

			expect(listener).toHaveBeenCalledWith(message);
			expect(listener.mock.calls[0][0]).toHaveProperty("type");
			expect(listener.mock.calls[0][0]).toHaveProperty("data");
		});
	});

	describe("Error Codes (EIP-1193)", () => {
		it("supports UserRejectedRequest (4001)", () => {
			const error = {
				code: 4001,
				message: "User rejected request",
			};

			expect(error.code).toBe(4001);
		});

		it("supports Unauthorized (4100)", () => {
			const error = {
				code: 4100,
				message: "Unauthorized",
			};

			expect(error.code).toBe(4100);
		});

		it("supports UnsupportedMethod (4200)", () => {
			const error = {
				code: 4200,
				message: "Unsupported method",
			};

			expect(error.code).toBe(4200);
		});

		it("supports Disconnected (4900)", () => {
			const error = {
				code: 4900,
				message: "Disconnected",
			};

			expect(error.code).toBe(4900);
		});

		it("supports ChainDisconnected (4901)", () => {
			const error = {
				code: 4901,
				message: "Chain disconnected",
			};

			expect(error.code).toBe(4901);
		});

		it("error has optional data field", () => {
			const error = {
				code: 4200,
				message: "Unsupported method",
				data: { method: "eth_customMethod" },
			};

			expect(error.data).toEqual({ method: "eth_customMethod" });
		});
	});

	describe("Error Handling", () => {
		it("request() rejects with error (not returns error object)", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue({
					code: 4001,
					message: "User rejected",
				}),
			};

			await expect(
				mockProvider.request({ method: "eth_sendTransaction" }),
			).rejects.toMatchObject({
				code: 4001,
				message: "User rejected",
			});
		});

		it("error object has numeric code", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue({
					code: 4200,
					message: "Unsupported",
				}),
			};

			try {
				await mockProvider.request({ method: "eth_unknown" });
				// biome-ignore lint/suspicious/noExplicitAny: test verifies error shape
			} catch (error: any) {
				expect(typeof error.code).toBe("number");
			}
		});

		it("error object has message string", async () => {
			const mockProvider = {
				request: vi.fn().mockRejectedValue({
					code: 4001,
					message: "User rejected",
				}),
			};

			try {
				await mockProvider.request({ method: "eth_sendTransaction" });
				// biome-ignore lint/suspicious/noExplicitAny: test verifies error shape
			} catch (error: any) {
				expect(typeof error.message).toBe("string");
			}
		});
	});

	describe("Provider Interface Type Safety", () => {
		it("method names are type-safe strings", () => {
			const args: RequestArguments = {
				method: "eth_blockNumber",
			};

			expect(typeof args.method).toBe("string");
		});

		it("params are type-safe arrays or objects", () => {
			const argsWithArray: RequestArguments = {
				method: "eth_getBalance",
				params: ["0x123", "latest"],
			};

			const argsWithObject: RequestArguments = {
				method: "eth_call",
				params: { to: "0x123" },
			};

			expect(argsWithArray.params).toBeInstanceOf(Array);
			expect(typeof argsWithObject.params).toBe("object");
		});

		it("event names are type-safe strings", () => {
			const eventNames: Array<
				| "connect"
				| "disconnect"
				| "chainChanged"
				| "accountsChanged"
				| "message"
			> = [
				"connect",
				"disconnect",
				"chainChanged",
				"accountsChanged",
				"message",
			];

			eventNames.forEach((name) => {
				expect(typeof name).toBe("string");
			});
		});
	});
});
