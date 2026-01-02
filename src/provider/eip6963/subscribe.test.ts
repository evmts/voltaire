/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidArgumentError } from "./errors.js";
import { reset } from "./state.js";
import { subscribe } from "./subscribe.js";

const validInfo = {
	uuid: "350670db-19fa-4704-a166-e52e178b59d2",
	name: "Test Wallet",
	icon: "data:image/svg+xml;base64,PHN2Zz4=",
	rdns: "com.test.wallet",
};

const mockProvider = {
	request: async () => {},
};

describe("subscribe", () => {
	beforeEach(() => {
		reset();
	});

	afterEach(() => {
		reset();
	});

	// Skip non-browser test in happy-dom environment
	it.skip("throws UnsupportedEnvironmentError in non-browser", () => {
		// This test requires Node environment without happy-dom
	});

	it("throws InvalidArgumentError when listener is not function", () => {
		// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
		expect(() => subscribe("not-a-function" as any)).toThrow(
			InvalidArgumentError,
		);
	});

	it("returns unsubscribe function", () => {
		const unsub = subscribe(() => {});
		expect(typeof unsub).toBe("function");
		unsub();
	});

	it("calls listener immediately with empty array", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);
		expect(listener).toHaveBeenCalledWith([]);
		unsub();
	});

	it("dispatches eip6963:requestProvider event", () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		const unsub = subscribe(() => {});

		const requestEvents = dispatchSpy.mock.calls.filter(
			// biome-ignore lint/suspicious/noExplicitAny: mock call signature
			(c: any[]) => c[0].type === "eip6963:requestProvider",
		);
		expect(requestEvents.length).toBeGreaterThan(0);

		unsub();
		dispatchSpy.mockRestore();
	});

	it("listens for eip6963:announceProvider events", () => {
		const addEventSpy = vi.spyOn(window, "addEventListener");
		const unsub = subscribe(() => {});

		expect(addEventSpy).toHaveBeenCalledWith(
			"eip6963:announceProvider",
			expect.any(Function),
		);

		unsub();
		addEventSpy.mockRestore();
	});

	it("calls listener with providers on announce", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);

		// Simulate announcement
		const announceEvent = new CustomEvent("eip6963:announceProvider", {
			detail: Object.freeze({ info: validInfo, provider: mockProvider }),
		});
		window.dispatchEvent(announceEvent);

		// Should have been called twice: once on subscribe, once on announce
		expect(listener).toHaveBeenCalledTimes(2);
		const lastCall = listener.mock.calls[1];
		expect(lastCall[0]).toHaveLength(1);
		expect(lastCall[0][0].info.uuid).toBe(validInfo.uuid);

		unsub();
	});

	it("deduplicates by uuid", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);

		// Announce same provider twice
		const detail = Object.freeze({ info: validInfo, provider: mockProvider });
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", { detail }),
		);
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", { detail }),
		);

		// Should still only have one provider
		const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
		expect(lastCall[0]).toHaveLength(1);

		unsub();
	});

	it("updates existing provider on same uuid", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);

		// Announce with updated name
		const updated = { ...validInfo, name: "Updated Wallet" };
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", {
				detail: Object.freeze({ info: validInfo, provider: mockProvider }),
			}),
		);
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", {
				detail: Object.freeze({ info: updated, provider: mockProvider }),
			}),
		);

		const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
		expect(lastCall[0]).toHaveLength(1);
		expect(lastCall[0][0].info.name).toBe("Updated Wallet");

		unsub();
	});

	it("removes listener on unsubscribe", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);
		const callCount = listener.mock.calls.length;

		unsub();

		// Announce after unsubscribe
		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", {
				detail: Object.freeze({ info: validInfo, provider: mockProvider }),
			}),
		);

		// Should not have received new call
		expect(listener.mock.calls.length).toBe(callCount);
	});

	it("removes event listener when all unsubscribed", () => {
		const removeSpy = vi.spyOn(window, "removeEventListener");
		const unsub = subscribe(() => {});
		unsub();

		expect(removeSpy).toHaveBeenCalledWith(
			"eip6963:announceProvider",
			expect.any(Function),
		);

		removeSpy.mockRestore();
	});

	it("handles multiple subscribers", () => {
		const listener1 = vi.fn();
		const listener2 = vi.fn();

		const unsub1 = subscribe(listener1);
		const unsub2 = subscribe(listener2);

		window.dispatchEvent(
			new CustomEvent("eip6963:announceProvider", {
				detail: Object.freeze({ info: validInfo, provider: mockProvider }),
			}),
		);

		// Both should receive the provider
		expect(
			listener1.mock.calls[listener1.mock.calls.length - 1][0],
		).toHaveLength(1);
		expect(
			listener2.mock.calls[listener2.mock.calls.length - 1][0],
		).toHaveLength(1);

		unsub1();
		unsub2();
	});
});
