import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribe } from "./subscribe.js";
import { reset } from "./state.js";
import {
	UnsupportedEnvironmentError,
	InvalidArgumentError,
} from "./errors.js";

const validInfo = {
	uuid: "350670db-19fa-4704-a166-e52e178b59d2",
	name: "Test Wallet",
	icon: "data:image/svg+xml;base64,PHN2Zz4=",
	rdns: "com.test.wallet",
};

const mockProvider = {
	request: async () => {},
};

const createMockWindow = () => {
	const listeners: Map<string, Set<EventListener>> = new Map();

	return {
		addEventListener: vi.fn((type: string, listener: EventListener) => {
			if (!listeners.has(type)) {
				listeners.set(type, new Set());
			}
			listeners.get(type)!.add(listener);
		}),
		removeEventListener: vi.fn((type: string, listener: EventListener) => {
			listeners.get(type)?.delete(listener);
		}),
		dispatchEvent: vi.fn((event: Event) => {
			const eventListeners = listeners.get(event.type);
			if (eventListeners) {
				for (const listener of eventListeners) {
					listener(event);
				}
			}
			return true;
		}),
		_listeners: listeners,
	};
};

describe("subscribe", () => {
	const originalWindow = globalThis.window;
	let mockWindow: ReturnType<typeof createMockWindow>;

	beforeEach(() => {
		reset();
		mockWindow = createMockWindow();
		(globalThis as any).window = mockWindow;
		// Need to also mock Event and CustomEvent
		(globalThis as any).Event = class Event {
			type: string;
			constructor(type: string) {
				this.type = type;
			}
		};
		(globalThis as any).CustomEvent = class CustomEvent extends (
			(globalThis as any).Event
		) {
			detail: any;
			constructor(type: string, options: { detail?: any } = {}) {
				super(type);
				this.detail = options.detail;
			}
		};
	});

	afterEach(() => {
		if (originalWindow !== undefined) {
			(globalThis as any).window = originalWindow;
		} else {
			delete (globalThis as any).window;
		}
		reset();
	});

	it("throws UnsupportedEnvironmentError in non-browser", () => {
		delete (globalThis as any).window;
		expect(() => subscribe(() => {})).toThrow(UnsupportedEnvironmentError);
	});

	it("throws InvalidArgumentError when listener is not function", () => {
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
		subscribe(listener);
		expect(listener).toHaveBeenCalledWith([]);
	});

	it("dispatches eip6963:requestProvider event", () => {
		subscribe(() => {});
		expect(mockWindow.dispatchEvent).toHaveBeenCalled();
		const calls = mockWindow.dispatchEvent.mock.calls;
		const requestEvents = calls.filter(
			(c: any[]) => c[0].type === "eip6963:requestProvider",
		);
		expect(requestEvents.length).toBeGreaterThan(0);
	});

	it("listens for eip6963:announceProvider events", () => {
		subscribe(() => {});
		expect(mockWindow.addEventListener).toHaveBeenCalledWith(
			"eip6963:announceProvider",
			expect.any(Function),
		);
	});

	it("calls listener with providers on announce", () => {
		const listener = vi.fn();
		subscribe(listener);

		// Simulate announcement
		const announceEvent = new (globalThis as any).CustomEvent(
			"eip6963:announceProvider",
			{
				detail: { info: validInfo, provider: mockProvider },
			},
		);
		mockWindow.dispatchEvent(announceEvent);

		// Should have been called twice: once on subscribe, once on announce
		expect(listener).toHaveBeenCalledTimes(2);
		const lastCall = listener.mock.calls[1];
		expect(lastCall[0]).toHaveLength(1);
		expect(lastCall[0][0].info.uuid).toBe(validInfo.uuid);
	});

	it("deduplicates by uuid", () => {
		const listener = vi.fn();
		subscribe(listener);

		// Announce same provider twice
		const detail = { info: validInfo, provider: mockProvider };
		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail,
			}),
		);
		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail,
			}),
		);

		// Should still only have one provider
		const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
		expect(lastCall[0]).toHaveLength(1);
	});

	it("updates existing provider on same uuid", () => {
		const listener = vi.fn();
		subscribe(listener);

		// Announce with updated name
		const updated = { ...validInfo, name: "Updated Wallet" };
		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail: { info: validInfo, provider: mockProvider },
			}),
		);
		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail: { info: updated, provider: mockProvider },
			}),
		);

		const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
		expect(lastCall[0]).toHaveLength(1);
		expect(lastCall[0][0].info.name).toBe("Updated Wallet");
	});

	it("removes listener on unsubscribe", () => {
		const listener = vi.fn();
		const unsub = subscribe(listener);
		const callCount = listener.mock.calls.length;

		unsub();

		// Announce after unsubscribe
		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail: { info: validInfo, provider: mockProvider },
			}),
		);

		// Should not have received new call
		expect(listener.mock.calls.length).toBe(callCount);
	});

	it("removes event listener when all unsubscribed", () => {
		const unsub = subscribe(() => {});
		unsub();

		expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
			"eip6963:announceProvider",
			expect.any(Function),
		);
	});

	it("handles multiple subscribers", () => {
		const listener1 = vi.fn();
		const listener2 = vi.fn();

		subscribe(listener1);
		subscribe(listener2);

		mockWindow.dispatchEvent(
			new (globalThis as any).CustomEvent("eip6963:announceProvider", {
				detail: { info: validInfo, provider: mockProvider },
			}),
		);

		// Both should receive the provider
		expect(listener1.mock.calls[listener1.mock.calls.length - 1][0]).toHaveLength(1);
		expect(listener2.mock.calls[listener2.mock.calls.length - 1][0]).toHaveLength(1);
	});
});
