import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { announce } from "./announce.js";
import {
	UnsupportedEnvironmentError,
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

describe("announce", () => {
	const originalWindow = globalThis.window;
	let mockWindow: ReturnType<typeof createMockWindow>;

	beforeEach(() => {
		mockWindow = createMockWindow();
		(globalThis as any).window = mockWindow;
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
	});

	it("throws UnsupportedEnvironmentError in non-browser", () => {
		delete (globalThis as any).window;
		expect(() => announce(validDetail)).toThrow(UnsupportedEnvironmentError);
	});

	it("throws InvalidArgumentError when detail is missing", () => {
		expect(() => announce(undefined as any)).toThrow(InvalidArgumentError);
	});

	it("throws InvalidArgumentError when info is missing", () => {
		expect(() =>
			announce({ info: undefined as any, provider: validDetail.provider }),
		).toThrow();
	});

	it("throws InvalidArgumentError when provider is missing", () => {
		expect(() =>
			announce({ info: validDetail.info, provider: undefined as any }),
		).toThrow();
	});

	it("validates info fields", () => {
		const badInfo = { ...validDetail.info, uuid: "bad-uuid" };
		expect(() =>
			announce({ info: badInfo, provider: validDetail.provider }),
		).toThrow(InvalidUuidError);
	});

	it("validates provider", () => {
		expect(() =>
			announce({ info: validDetail.info, provider: {} as any }),
		).toThrow(InvalidProviderError);
	});

	it("returns unsubscribe function", () => {
		const unsub = announce(validDetail);
		expect(typeof unsub).toBe("function");
		unsub();
	});

	it("dispatches eip6963:announceProvider event immediately", () => {
		announce(validDetail);
		expect(mockWindow.dispatchEvent).toHaveBeenCalled();
		const calls = mockWindow.dispatchEvent.mock.calls;
		const announceEvents = calls.filter(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		);
		expect(announceEvents.length).toBeGreaterThan(0);
	});

	it("re-announces on eip6963:requestProvider events", () => {
		announce(validDetail);
		const initialCallCount = mockWindow.dispatchEvent.mock.calls.filter(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		).length;

		// Simulate request event
		const requestEvent = new (globalThis as any).Event(
			"eip6963:requestProvider",
		);
		mockWindow.dispatchEvent(requestEvent);

		const finalCallCount = mockWindow.dispatchEvent.mock.calls.filter(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		).length;
		expect(finalCallCount).toBeGreaterThan(initialCallCount);
	});

	it("stops re-announcing after unsubscribe", () => {
		const unsub = announce(validDetail);
		unsub();

		const countBefore = mockWindow.dispatchEvent.mock.calls.filter(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		).length;

		// Simulate request event
		const requestEvent = new (globalThis as any).Event(
			"eip6963:requestProvider",
		);
		mockWindow.dispatchEvent(requestEvent);

		const countAfter = mockWindow.dispatchEvent.mock.calls.filter(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		).length;
		expect(countAfter).toBe(countBefore);
	});

	it("event detail is frozen", () => {
		announce(validDetail);
		const calls = mockWindow.dispatchEvent.mock.calls;
		const announceEvent = calls.find(
			(c: any[]) => c[0].type === "eip6963:announceProvider",
		);
		expect(Object.isFrozen(announceEvent[0].detail)).toBe(true);
	});
});
