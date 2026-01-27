/**
 * Vitest setup file for voltaire-effect
 * Loads WASM module before running tests (optional - skips if not found)
 * Note: WASM loading is skipped in CI since voltaire-effect tests don't require it
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll } from "vitest";

console.log("debug: setup loaded");

const wasmPath = resolve(import.meta.dirname, "../wasm/primitives.wasm");

if (existsSync(wasmPath)) {
	const { loadWasm } = await import("../src/wasm-loader/loader.js");
	const wasmBuffer = readFileSync(wasmPath);
	await loadWasm(wasmBuffer.buffer);
}

afterAll(() => {
	if (typeof process === "undefined" || !process._getActiveHandles) return;
	const handles = process._getActiveHandles().map((handle) => {
		if (handle && typeof handle === "object") {
			return handle.constructor?.name ?? "Unknown";
		}
		return typeof handle;
	});
	const uniqueHandles = Array.from(new Set(handles));
	console.log("debug: active handles", uniqueHandles);
});

if (typeof process !== "undefined" && process._getActiveHandles) {
	const timer = setTimeout(() => {
		const handles = process._getActiveHandles().map((handle) => {
			if (handle && typeof handle === "object") {
				return handle.constructor?.name ?? "Unknown";
			}
			return typeof handle;
		});
		const uniqueHandles = Array.from(new Set(handles));
		console.log("debug: active handles (timeout)", uniqueHandles);
	}, 5000);
	timer.unref?.();
}
