import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getPlatform, assertBrowser } from "./getPlatform.js";
import { UnsupportedEnvironmentError } from "./errors.js";

describe("getPlatform", () => {
	const originalWindow = globalThis.window;
	const originalProcess = globalThis.process;
	const originalBun = (globalThis as any).Bun;

	afterEach(() => {
		// Restore globals
		if (originalWindow !== undefined) {
			(globalThis as any).window = originalWindow;
		} else {
			delete (globalThis as any).window;
		}
		(globalThis as any).process = originalProcess;
		if (originalBun !== undefined) {
			(globalThis as any).Bun = originalBun;
		} else {
			delete (globalThis as any).Bun;
		}
	});

	it("returns 'browser' when window is defined with dispatchEvent", () => {
		(globalThis as any).window = {
			dispatchEvent: () => {},
		};
		delete (globalThis as any).Bun;
		expect(getPlatform()).toBe("browser");
	});

	it("returns 'node' when process.versions.node is defined", () => {
		delete (globalThis as any).window;
		delete (globalThis as any).Bun;
		(globalThis as any).process = { versions: { node: "18.0.0" } };
		expect(getPlatform()).toBe("node");
	});

	it("returns 'bun' when Bun is defined", () => {
		delete (globalThis as any).window;
		(globalThis as any).Bun = {};
		expect(getPlatform()).toBe("bun");
	});

	it("returns 'unknown' when no platform detected", () => {
		delete (globalThis as any).window;
		delete (globalThis as any).Bun;
		(globalThis as any).process = {};
		expect(getPlatform()).toBe("unknown");
	});

	it("prioritizes browser over node", () => {
		(globalThis as any).window = {
			dispatchEvent: () => {},
		};
		(globalThis as any).process = { versions: { node: "18.0.0" } };
		delete (globalThis as any).Bun;
		expect(getPlatform()).toBe("browser");
	});
});

describe("assertBrowser", () => {
	const originalWindow = globalThis.window;
	const originalBun = (globalThis as any).Bun;

	afterEach(() => {
		if (originalWindow !== undefined) {
			(globalThis as any).window = originalWindow;
		} else {
			delete (globalThis as any).window;
		}
		if (originalBun !== undefined) {
			(globalThis as any).Bun = originalBun;
		} else {
			delete (globalThis as any).Bun;
		}
	});

	it("throws UnsupportedEnvironmentError when not in browser", () => {
		delete (globalThis as any).window;
		delete (globalThis as any).Bun;
		expect(() => assertBrowser()).toThrow(UnsupportedEnvironmentError);
	});

	it("does not throw when in browser", () => {
		(globalThis as any).window = {
			dispatchEvent: () => {},
		};
		delete (globalThis as any).Bun;
		expect(() => assertBrowser()).not.toThrow();
	});

	it("includes platform name in error", () => {
		delete (globalThis as any).window;
		delete (globalThis as any).Bun;
		try {
			assertBrowser();
		} catch (e) {
			expect((e as UnsupportedEnvironmentError).platform).toBe("node");
		}
	});
});
