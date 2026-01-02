import { describe, expect, it } from "vitest";
import { from, JsonRpcVersion, VERSION } from "./index.js";

describe("JsonRpcVersion", () => {
	describe("from", () => {
		it("returns version 2.0", () => {
			expect(from()).toBe("2.0");
		});

		it("matches VERSION constant", () => {
			expect(from()).toBe(VERSION);
		});
	});

	describe("constants", () => {
		it("VERSION is 2.0", () => {
			expect(VERSION).toBe("2.0");
		});

		it("JsonRpcVersion.VERSION is 2.0", () => {
			expect(JsonRpcVersion.VERSION).toBe("2.0");
		});
	});

	describe("namespace", () => {
		it("JsonRpcVersion.from() returns 2.0", () => {
			expect(JsonRpcVersion.from()).toBe("2.0");
		});
	});
});
