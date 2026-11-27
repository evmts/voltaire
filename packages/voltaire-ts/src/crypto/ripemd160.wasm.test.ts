import { describe, expect, it } from "vitest";
import { isWasmLoaded, unloadWasm } from "../wasm-loader/loader.js";
import { Ripemd160 } from "./Ripemd160/index.js";
import { Ripemd160Wasm } from "./ripemd160.wasm.js";

describe("Ripemd160Wasm (standalone 1.5 kB micro-WASM)", () => {
	it("auto-initializes standalone ripemd160.wasm without loading primitives.wasm", () => {
		unloadWasm();
		Ripemd160Wasm.reset();
		expect(isWasmLoaded()).toBe(false);
		expect(Ripemd160Wasm.isReady()).toBe(false);

		const digest = Ripemd160Wasm.hashString("abc");
		expect(Ripemd160Wasm.isReady()).toBe(true);
		expect(isWasmLoaded()).toBe(false);
		expect(digest).toEqual(Ripemd160.hashString("abc"));
	});

	it("matches pure JS across empty, string, bytes, hex, and large inputs", async () => {
		await Ripemd160Wasm.load();
		expect(Ripemd160Wasm.hash(new Uint8Array(0))).toEqual(
			Ripemd160.hash(new Uint8Array(0)),
		);
		expect(Ripemd160Wasm.hashString("hello")).toEqual(
			Ripemd160.hashString("hello"),
		);
		expect(Ripemd160Wasm.hashHex("0xdeadbeef")).toEqual(
			Ripemd160.hashHex("0xdeadbeef"),
		);
		const large = new Uint8Array(128 * 1024).fill(0x5a);
		expect(Ripemd160Wasm.hash(large)).toEqual(Ripemd160.hash(large));
	});
});
