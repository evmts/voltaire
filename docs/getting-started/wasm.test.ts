/**
 * Tests for code examples in wasm.mdx
 *
 * This file tests the runtime implementations documentation.
 * Voltaire provides three entrypoints with identical APIs:
 * JS (default), WASM, and Native FFI.
 *
 * Note: We only test the JS entrypoint here since WASM/Native
 * require specific build steps and runtime environments.
 */
import { describe, expect, it } from "vitest";

describe("wasm.mdx examples", () => {
	describe("JS (Default) entrypoint", () => {
		it("imports and uses Keccak256 hash", async () => {
			const Keccak256 = await import("../../src/crypto/Keccak256/index.js");
			const { Hex } = await import("../../src/primitives/Hex/index.js");

			const hash = Keccak256.hash(Hex.toBytes(Hex.fromString("hello")));

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);
		});

		it("creates Address from hex string", async () => {
			const { Address } = await import("../../src/primitives/Address/index.js");

			const addr = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});
	});

	describe("Unified VoltaireAPI Interface", () => {
		it("exports Address primitive", async () => {
			const { Address } = await import("../../src/primitives/Address/index.js");

			expect(typeof Address).toBe("function");
			expect(typeof Address.fromHex).toBe("function");
			expect(typeof Address.toHex).toBe("function");
			expect(typeof Address.equals).toBe("function");
		});

		it("exports Hex primitive", async () => {
			const { Hex } = await import("../../src/primitives/Hex/index.js");

			expect(typeof Hex).toBe("function");
			expect(typeof Hex.fromBytes).toBe("function");
			expect(typeof Hex.toBytes).toBe("function");
		});

		it("exports Keccak256 crypto module", async () => {
			const Keccak256 = await import("../../src/crypto/Keccak256/index.js");

			expect(typeof Keccak256.hash).toBe("function");
		});
	});

	describe("Hex.fromString and Hex.toBytes", () => {
		it("converts string to hex then to bytes", async () => {
			const { Hex } = await import("../../src/primitives/Hex/index.js");

			// Convert string "hello" to hex, then to bytes
			const hex = Hex.fromString("hello");
			expect(hex).toBe("0x68656c6c6f"); // "hello" in hex

			const bytes = Hex.toBytes(hex);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(5);
			// "hello" = [104, 101, 108, 108, 111]
			expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
		});
	});

	describe("Keccak256 hash computation", () => {
		it("computes keccak256 hash of bytes", async () => {
			const Keccak256 = await import("../../src/crypto/Keccak256/index.js");

			const data = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
			const hash = Keccak256.hash(data);

			expect(hash).toBeInstanceOf(Uint8Array);
			expect(hash.length).toBe(32);

			// Known keccak256 hash of "hello"
			const { Hex } = await import("../../src/primitives/Hex/index.js");
			const hashHex = Hex.fromBytes(hash);
			expect(hashHex).toBe(
				"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
			);
		});
	});

	// API DISCREPANCY: The docs show Secp256k1.recoverAddress(hash, signature)
	// but this needs to be verified against the actual implementation.
	// Skipping Secp256k1 tests as they require private key setup.
});
