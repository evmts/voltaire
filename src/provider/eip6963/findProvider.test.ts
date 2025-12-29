import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { findProvider } from "./findProvider.js";
import { providers, reset } from "./state.js";
import { ProviderDetail } from "./ProviderDetail.js";
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

describe("findProvider", () => {
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
		expect(() => findProvider({ rdns: "io.metamask" })).toThrow(
			UnsupportedEnvironmentError,
		);
	});

	it("throws InvalidArgumentError when options is missing", () => {
		expect(() => findProvider(undefined as any)).toThrow(InvalidArgumentError);
	});

	it("throws InvalidArgumentError when rdns is missing", () => {
		expect(() => findProvider({} as any)).toThrow(InvalidArgumentError);
	});

	it("returns undefined when no providers", () => {
		const result = findProvider({ rdns: "io.metamask" });
		expect(result).toBeUndefined();
	});

	it("returns undefined when rdns not found", () => {
		const detail = ProviderDetail({ info: validInfo, provider: mockProvider });
		providers.set(validInfo.uuid, detail);

		const result = findProvider({ rdns: "io.metamask" });
		expect(result).toBeUndefined();
	});

	it("returns matching provider", () => {
		const detail = ProviderDetail({ info: validInfo, provider: mockProvider });
		providers.set(validInfo.uuid, detail);

		const result = findProvider({ rdns: validInfo.rdns });
		expect(result).toBeDefined();
		expect(result?.info.rdns).toBe(validInfo.rdns);
	});

	it("returns first match when multiple have same rdns", () => {
		const detail1 = ProviderDetail({ info: validInfo, provider: mockProvider });
		const info2 = {
			...validInfo,
			uuid: "450670db-19fa-4704-a166-e52e178b59d2",
			name: "Second Wallet",
		};
		const detail2 = ProviderDetail({ info: info2, provider: mockProvider });

		providers.set(validInfo.uuid, detail1);
		providers.set(info2.uuid, detail2);

		const result = findProvider({ rdns: validInfo.rdns });
		expect(result).toBeDefined();
		// Should get first one added
	});
});
