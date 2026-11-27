import { describe, expect, it } from "vitest";
import { isWasmLoaded, unloadWasm } from "../wasm-loader/loader.js";
import { SHA256 } from "./SHA256/index.js";
import { Sha256Wasm } from "./sha256.wasm.js";

describe("Sha256Wasm", () => {
	it("auto-initializes WASM synchronously on first hash call in Node/Bun", () => {
		unloadWasm();
		expect(isWasmLoaded()).toBe(false);
		const data = new TextEncoder().encode("hello sha256 wasm");
		const digest = Sha256Wasm.hash(data);
		expect(isWasmLoaded()).toBe(true);
		expect(digest).toEqual(SHA256.hash(data));
	});

	it("matches pure JS across hashString, hashHex, toHex, and streaming create()", () => {
		expect(Sha256Wasm.hashString("")).toEqual(SHA256.hashString(""));
		expect(Sha256Wasm.hashString("abc")).toEqual(SHA256.hashString("abc"));
		expect(Sha256Wasm.hashHex("0xdeadbeef")).toEqual(
			SHA256.hashHex("0xdeadbeef"),
		);
		expect(Sha256Wasm.toHex(Sha256Wasm.hashString("abc"))).toBe(
			SHA256.toHex(SHA256.hashString("abc")),
		);

		const hasher = Sha256Wasm.create();
		hasher.update(new TextEncoder().encode("hello "));
		hasher.update(new TextEncoder().encode("world"));
		expect(hasher.digest()).toEqual(SHA256.hashString("hello world"));
	});
});
