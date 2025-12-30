/**
 * @vitest-environment happy-dom
 */
/**
 * LLM One-Shot Testing for EIP-6963
 *
 * These tests validate that the EIP-6963 API is usable from documentation alone.
 * Each test represents a scenario where an LLM (or developer) reads the docs
 * and writes code to accomplish a task.
 *
 * Success criteria:
 * - Code is syntactically correct
 * - Correct API methods are used
 * - Cleanup (unsubscribe) is handled properly
 * - No hallucinated methods
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as EIP6963 from "../index.js";
import { reset } from "../state.js";

const validInfo = {
	uuid: "350670db-19fa-4704-a166-e52e178b59d2",
	name: "Test Wallet",
	icon: "data:image/svg+xml;base64,PHN2Zz4=",
	rdns: "com.test.wallet",
};

const mockProvider = {
	request: async () => {},
};

describe("LLM One-Shot Tests: EIP-6963", () => {
	beforeEach(() => {
		reset();
	});

	afterEach(() => {
		reset();
	});

	describe("Scenario 1: Dapp discovers available wallets", () => {
		/**
		 * Prompt: "Subscribe to wallet announcements and log each wallet name"
		 *
		 * Expected: Code uses subscribe(), accesses info.name, handles unsubscribe
		 */
		it("generates correct code for wallet discovery", () => {
			// Code an LLM would generate from docs:
			const walletNames: string[] = [];

			const unsubscribe = EIP6963.subscribe((providers) => {
				for (const { info } of providers) {
					if (!walletNames.includes(info.name)) {
						walletNames.push(info.name);
					}
				}
			});

			// Validate:
			expect(typeof unsubscribe).toBe("function");

			// Simulate wallet announcement using happy-dom's real window
			window.dispatchEvent(
				new CustomEvent("eip6963:announceProvider", {
					detail: Object.freeze({
						info: validInfo,
						provider: mockProvider,
					}),
				}),
			);

			expect(walletNames).toContain("Test Wallet");

			// Cleanup
			unsubscribe();
		});
	});

	describe("Scenario 2: Find MetaMask and connect", () => {
		/**
		 * Prompt: "Find MetaMask provider by rdns and call eth_accounts"
		 *
		 * Expected: Uses findProvider({ rdns }), calls provider.request()
		 */
		it("generates correct code for finding specific provider", async () => {
			const mockRequest = vi.fn().mockResolvedValue(["0x1234"]);

			// Subscribe first to enable discovery
			const unsub = EIP6963.subscribe(() => {});

			// Simulate MetaMask announcement
			window.dispatchEvent(
				new CustomEvent("eip6963:announceProvider", {
					detail: Object.freeze({
						info: {
							uuid: "550670db-19fa-4704-a166-e52e178b59d2",
							name: "MetaMask",
							icon: "data:image/svg+xml;base64,PHN2Zz4=",
							rdns: "io.metamask",
						},
						provider: { request: mockRequest },
					}),
				}),
			);

			// Code an LLM would generate from docs:
			const metamask = EIP6963.findProvider({ rdns: "io.metamask" });

			if (metamask) {
				const accounts = await metamask.provider.request({
					method: "eth_accounts",
				});
				expect(accounts).toEqual(["0x1234"]);
			}

			expect(metamask).toBeDefined();
			expect(mockRequest).toHaveBeenCalledWith({ method: "eth_accounts" });

			unsub();
		});
	});

	describe("Scenario 3: Wallet announces itself", () => {
		/**
		 * Prompt: "Announce a wallet with uuid, name, icon, rdns"
		 *
		 * Expected: Uses announce() with all 4 info fields, stores unsubscribe
		 */
		it("generates correct code for wallet announcement", () => {
			const dispatchSpy = vi.spyOn(window, "dispatchEvent");

			// Code an LLM would generate from docs:
			const unsubscribe = EIP6963.announce({
				info: {
					uuid: "650670db-19fa-4704-a166-e52e178b59d2",
					name: "My Wallet",
					icon: "data:image/svg+xml;base64,PHN2Zz4=",
					rdns: "com.mywallet",
				},
				provider: {
					request: async () => {},
				},
			});

			// Validate:
			expect(typeof unsubscribe).toBe("function");

			// Verify announcement was dispatched
			const announceEvents = dispatchSpy.mock.calls.filter(
				(c: any[]) => c[0].type === "eip6963:announceProvider",
			);
			expect(announceEvents.length).toBeGreaterThan(0);

			// Cleanup
			unsubscribe();
			dispatchSpy.mockRestore();
		});
	});

	describe("Scenario 4: Type-safe provider info creation", () => {
		/**
		 * Prompt: "Create a validated ProviderInfo object"
		 *
		 * Expected: Uses ProviderInfo() constructor with all fields
		 */
		it("generates correct code for ProviderInfo creation", () => {
			// Code an LLM would generate from docs:
			const info = EIP6963.ProviderInfo({
				uuid: "750670db-19fa-4704-a166-e52e178b59d2",
				name: "Example Wallet",
				icon: "data:image/svg+xml;base64,PHN2Zz4=",
				rdns: "com.example.wallet",
			});

			// Validate:
			expect(info.name).toBe("Example Wallet");
			expect(Object.isFrozen(info)).toBe(true);
		});
	});

	describe("Scenario 5: Environment detection", () => {
		/**
		 * Prompt: "Check if we're in a browser before using EIP-6963"
		 *
		 * Expected: Uses getPlatform() and checks for 'browser'
		 */
		it("generates correct code for environment detection", () => {
			// Code an LLM would generate from docs:
			const platform = EIP6963.getPlatform();

			// In happy-dom environment, this should be 'browser'
			if (platform === "browser") {
				// Safe to use EIP-6963
				const unsubscribe = EIP6963.subscribe(() => {});
				expect(typeof unsubscribe).toBe("function");
				unsubscribe();
			}

			expect(platform).toBe("browser");
		});
	});

	describe("Scenario 6: Error handling", () => {
		/**
		 * Prompt: "Handle UnsupportedEnvironmentError when not in browser"
		 *
		 * Expected: Uses try/catch with instanceof check
		 */
		it("generates correct code for error handling", () => {
			// In happy-dom, we ARE in a browser, so this won't throw
			// Test the error class exists and can be used for instanceof
			const error = new EIP6963.UnsupportedEnvironmentError("test-platform");

			expect(error instanceof EIP6963.UnsupportedEnvironmentError).toBe(true);
			expect(error instanceof EIP6963.EIP6963Error).toBe(true);
			expect(error.platform).toBe("test-platform");
		});
	});

	describe("Scenario 7: Get current providers snapshot", () => {
		/**
		 * Prompt: "Get a list of all currently discovered providers"
		 *
		 * Expected: Uses getProviders() to get snapshot
		 */
		it("generates correct code for getting providers", () => {
			// First subscribe to start discovery
			const unsub = EIP6963.subscribe(() => {});

			// Code an LLM would generate from docs:
			const providers = EIP6963.getProviders();

			expect(Array.isArray(providers)).toBe(true);

			unsub();
		});
	});

	describe("API Completeness Validation", () => {
		/**
		 * Verify that all documented API methods exist and are functions
		 */
		it("exports all documented functions", () => {
			// Core functions from docs
			expect(typeof EIP6963.subscribe).toBe("function");
			expect(typeof EIP6963.getProviders).toBe("function");
			expect(typeof EIP6963.findProvider).toBe("function");
			expect(typeof EIP6963.announce).toBe("function");
			expect(typeof EIP6963.getPlatform).toBe("function");
			expect(typeof EIP6963.ProviderInfo).toBe("function");
			expect(typeof EIP6963.ProviderDetail).toBe("function");
		});

		it("exports all documented error classes", () => {
			expect(EIP6963.EIP6963Error).toBeDefined();
			expect(EIP6963.UnsupportedEnvironmentError).toBeDefined();
			expect(EIP6963.InvalidUuidError).toBeDefined();
			expect(EIP6963.InvalidRdnsError).toBeDefined();
			expect(EIP6963.InvalidIconError).toBeDefined();
			expect(EIP6963.InvalidProviderError).toBeDefined();
			expect(EIP6963.MissingFieldError).toBeDefined();
			expect(EIP6963.InvalidArgumentError).toBeDefined();
		});

		it("exports documented type aliases", () => {
			// Types are compile-time only, but we can verify the namespace exports don't error
			const _: EIP6963.ProviderInfoType = {
				uuid: "350670db-19fa-4704-a166-e52e178b59d2",
				name: "Test",
				icon: "data:image/png;base64,abc",
				rdns: "com.test",
			} as any;
			expect(_).toBeDefined();
		});
	});
});
