import { readFile } from "node:fs/promises";
import { blake2b as nobleBlake2b } from "@noble/hashes/blake2.js";
import { beforeAll, describe, expect, it } from "vitest";
import {
	blake2b,
	blake2Hash,
	getExports,
	keccak256,
	loadWasm,
	p256DerivePublicKey,
	p256Ecdh,
	resetMemory,
} from "./loader.js";

const WASM_PATH = new URL("../../wasm/primitives.wasm", import.meta.url);
const BLAKE2_WASM_PATH = new URL(
	"../../wasm/crypto/blake2.wasm",
	import.meta.url,
);

async function bytesOf(url: URL): Promise<ArrayBuffer> {
	const file = await readFile(url);
	return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
}

describe("WASM loader memory safety", () => {
	beforeAll(async () => {
		await loadWasm(WASM_PATH, true);
	});

	it("does not overwrite module static data with a large scratch buffer", () => {
		const small = new Uint8Array([1, 2, 3]);
		const expected = keccak256(small);
		// The old allocator started at 64 KiB; 20 MiB of input ran across the
		// module's static data at 16 MiB and corrupted it.
		const big = new Uint8Array(20 * 1024 * 1024).fill(0xff);
		expect(blake2b(big)).toEqual(nobleBlake2b(big));
		resetMemory();
		expect(keccak256(small)).toEqual(expected);
		expect(blake2b(small)).toEqual(nobleBlake2b(small));
	});
});

describe("loadWasm ArrayBuffer identity", () => {
	it("reloads when given a different ArrayBuffer", async () => {
		const first = await bytesOf(WASM_PATH);
		const second = await bytesOf(BLAKE2_WASM_PATH);
		await loadWasm(first, true);
		const exportsA = getExports();
		expect(typeof exportsA.primitives_keccak256).toBe("function");

		await loadWasm(second);
		const exportsB = getExports();
		expect(exportsB).not.toBe(exportsA);
		expect(typeof exportsB.blake2Hash).toBe("function");
	});

	it("reuses the instance for the same ArrayBuffer object", async () => {
		const buffer = await bytesOf(WASM_PATH);
		await loadWasm(buffer, true);
		const a = getExports();
		await loadWasm(buffer);
		expect(getExports()).toBe(a);
	});

	it("reloads when switching from an ArrayBuffer back to a path", async () => {
		await loadWasm(await bytesOf(BLAKE2_WASM_PATH), true);
		const a = getExports();
		await loadWasm(WASM_PATH);
		expect(getExports()).not.toBe(a);
	});
});

describe("blake2Hash output length", () => {
	beforeAll(async () => {
		await loadWasm(BLAKE2_WASM_PATH, true);
	});

	it("passes the output length through and slices the digest", () => {
		const data = new TextEncoder().encode("voltaire");
		for (const len of [1, 20, 32, 48, 64]) {
			expect(blake2Hash(data, len)).toEqual(nobleBlake2b(data, { dkLen: len }));
		}
	});

	it.each([0, 65, -1, 1.5, Number.NaN])("rejects output length %s", (len) => {
		expect(() => blake2Hash(new Uint8Array([1]), len)).toThrow(/output length/);
	});
});

describe("P256 input lengths", () => {
	beforeAll(async () => {
		await loadWasm(WASM_PATH, true);
	});

	it("p256DerivePublicKey rejects a non-32-byte private key", () => {
		expect(() => p256DerivePublicKey(new Uint8Array(31))).toThrow(
			"P256 private key must be 32 bytes, got 31",
		);
		expect(() => p256DerivePublicKey(new Uint8Array(33))).toThrow(
			"P256 private key must be 32 bytes, got 33",
		);
	});

	it("p256Ecdh rejects wrong private and public key lengths", () => {
		expect(() => p256Ecdh(new Uint8Array(16), new Uint8Array(64))).toThrow(
			"P256 private key must be 32 bytes, got 16",
		);
		expect(() => p256Ecdh(new Uint8Array(32), new Uint8Array(65))).toThrow(
			"P256 public key must be 64 bytes, got 65",
		);
	});
});
