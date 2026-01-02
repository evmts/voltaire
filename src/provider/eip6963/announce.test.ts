/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { announce } from "./announce.js";
import {
	InvalidArgumentError,
	InvalidProviderError,
	InvalidUuidError,
} from "./errors.js";

const validDetail = {
	info: {
		uuid: "350670db-19fa-4704-a166-e52e178b59d2",
		name: "Test Wallet",
		icon: "data:image/svg+xml;base64,PHN2Zz4=",
		rdns: "com.test.wallet",
	},
	provider: {
		request: async () => {},
	},
};

describe("announce", () => {
	it("throws InvalidArgumentError when detail is missing", () => {
		// @ts-expect-error - testing invalid input
		expect(() => announce()).toThrow(InvalidArgumentError);
	});

	it("validates info fields", () => {
		expect(() =>
			announce({
				info: {
					uuid: "invalid-uuid",
					name: "Test",
					icon: "data:image/svg+xml;base64,PHN2Zz4=",
					rdns: "com.test",
				},
				provider: { request: async () => {} },
			}),
		).toThrow(InvalidUuidError);
	});

	it("validates provider", () => {
		expect(() =>
			announce({
				info: validDetail.info,
				// @ts-expect-error - testing invalid input
				provider: {},
			}),
		).toThrow(InvalidProviderError);
	});

	it("returns unsubscribe function", () => {
		const unsubscribe = announce(validDetail);
		expect(typeof unsubscribe).toBe("function");
		unsubscribe();
	});

	it("dispatches eip6963:announceProvider event immediately", () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		const unsubscribe = announce(validDetail);

		expect(dispatchSpy).toHaveBeenCalledTimes(1);
		const event = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(event.type).toBe("eip6963:announceProvider");
		expect(event.detail.info.uuid).toBe(validDetail.info.uuid);

		unsubscribe();
		dispatchSpy.mockRestore();
	});

	it("re-announces on eip6963:requestProvider events", () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		const unsubscribe = announce(validDetail);

		// Initial announcement
		expect(dispatchSpy).toHaveBeenCalledTimes(1);

		// Simulate request event
		window.dispatchEvent(new Event("eip6963:requestProvider"));

		// Should have re-announced
		expect(dispatchSpy).toHaveBeenCalledTimes(3); // initial + request + re-announce

		unsubscribe();
		dispatchSpy.mockRestore();
	});

	it("stops re-announcing after unsubscribe", () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		const unsubscribe = announce(validDetail);

		unsubscribe();
		const callCount = dispatchSpy.mock.calls.length;

		// Simulate request event after unsubscribe
		window.dispatchEvent(new Event("eip6963:requestProvider"));

		// Should not have re-announced (only the request event itself)
		expect(dispatchSpy).toHaveBeenCalledTimes(callCount + 1);

		dispatchSpy.mockRestore();
	});

	it("event detail is frozen", () => {
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");
		announce(validDetail);

		const event = dispatchSpy.mock.calls[0]?.[0] as CustomEvent;
		expect(Object.isFrozen(event.detail)).toBe(true);

		dispatchSpy.mockRestore();
	});
});
