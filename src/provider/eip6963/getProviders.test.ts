import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProviders } from "./getProviders.js";
import { providers, reset } from "./state.js";
import { ProviderDetail } from "./ProviderDetail.js";
import { UnsupportedEnvironmentError } from "./errors.js";

const validInfo = {
	uuid: "350670db-19fa-4704-a166-e52e178b59d2",
	name: "Test Wallet",
	icon: "data:image/svg+xml;base64,PHN2Zz4=",
	rdns: "com.test.wallet",
};

const mockProvider = {
	request: async () => {},
};

describe("getProviders", () => {
	const originalWindow = globalThis.window;

	beforeEach(() => {
		reset();
		(globalThis as any).window = {
			dispatchEvent: () => {},
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
		expect(() => getProviders()).toThrow(UnsupportedEnvironmentError);
	});

	it("returns empty array before any subscriptions", () => {
		const result = getProviders();
		expect(result).toEqual([]);
	});

	it("returns discovered providers", () => {
		// Manually add provider to state
		const detail = ProviderDetail({ info: validInfo, provider: mockProvider });
		providers.set(validInfo.uuid, detail);

		const result = getProviders();
		expect(result).toHaveLength(1);
		expect(result[0].info.uuid).toBe(validInfo.uuid);
	});

	it("returns copy of providers array", () => {
		const detail = ProviderDetail({ info: validInfo, provider: mockProvider });
		providers.set(validInfo.uuid, detail);

		const result1 = getProviders();
		const result2 = getProviders();

		expect(result1).not.toBe(result2);
		expect(result1).toEqual(result2);
	});
});
