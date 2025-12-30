/**
 * @vitest-environment node
 */
import { afterEach, describe, expect, it } from "vitest";
import { UnsupportedEnvironmentError } from "./errors.js";
import { assertBrowser, getPlatform } from "./getPlatform.js";

describe("getPlatform", () => {
	const originalDispatchEvent = globalThis.dispatchEvent;
	const originalProcess = globalThis.process;
	const originalBun = (globalThis as any).Bun;

	afterEach(() => {
		// Restore globals
		// Note: getPlatform.js captures `window = globalThis`, so we need to modify
		// globalThis.dispatchEvent directly, not globalThis.window.dispatchEvent
		(globalThis as any).dispatchEvent = originalDispatchEvent;
		(globalThis as any).process = originalProcess;
		if (originalBun !== undefined) {
			(globalThis as any).Bun = originalBun;
		} else {
			(globalThis as any).Bun = undefined;
		}
	});

	it("returns 'browser' when dispatchEvent is defined on globalThis", () => {
		// The module does: const window = globalThis;
		// Then checks: typeof window.dispatchEvent === "function"
		// So we need to set globalThis.dispatchEvent
		(globalThis as any).dispatchEvent = () => {};
		(globalThis as any).Bun = undefined;
		expect(getPlatform()).toBe("browser");
	});

	it("returns 'node' when process.versions.node is defined", () => {
		(globalThis as any).dispatchEvent = undefined;
		(globalThis as any).Bun = undefined;
		(globalThis as any).process = { versions: { node: "18.0.0" } };
		expect(getPlatform()).toBe("node");
	});

	it("returns 'bun' when Bun is defined", () => {
		(globalThis as any).dispatchEvent = undefined;
		(globalThis as any).Bun = {};
		expect(getPlatform()).toBe("bun");
	});

	it("returns 'unknown' when no platform detected", () => {
		(globalThis as any).dispatchEvent = undefined;
		(globalThis as any).Bun = undefined;
		(globalThis as any).process = {};
		expect(getPlatform()).toBe("unknown");
	});

	it("prioritizes browser over node", () => {
		(globalThis as any).dispatchEvent = () => {};
		(globalThis as any).process = { versions: { node: "18.0.0" } };
		(globalThis as any).Bun = undefined;
		expect(getPlatform()).toBe("browser");
	});
});

describe("assertBrowser", () => {
	const originalDispatchEvent = globalThis.dispatchEvent;
	const originalBun = (globalThis as any).Bun;

	afterEach(() => {
		(globalThis as any).dispatchEvent = originalDispatchEvent;
		if (originalBun !== undefined) {
			(globalThis as any).Bun = originalBun;
		} else {
			(globalThis as any).Bun = undefined;
		}
	});

	it("throws UnsupportedEnvironmentError when not in browser", () => {
		(globalThis as any).dispatchEvent = undefined;
		(globalThis as any).Bun = undefined;
		expect(() => assertBrowser()).toThrow(UnsupportedEnvironmentError);
	});

	it("does not throw when in browser", () => {
		(globalThis as any).dispatchEvent = () => {};
		(globalThis as any).Bun = undefined;
		expect(() => assertBrowser()).not.toThrow();
	});

	it("includes platform name in error", () => {
		(globalThis as any).dispatchEvent = undefined;
		(globalThis as any).Bun = undefined;
		try {
			assertBrowser();
		} catch (e) {
			expect((e as UnsupportedEnvironmentError).platform).toBe("node");
		}
	});
});
