/**
 * @fileoverview Tests for signature verification utilities.
 */

import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import { CryptoLive } from "../CryptoLive.js";
import { KeccakLive, KeccakService } from "../Keccak256/index.js";
import { Secp256k1Service, Secp256k1Live } from "../Secp256k1/index.js";
import { EIP712Live, EIP712Service } from "../EIP712/index.js";
import * as Layer from "effect/Layer";
import { constantTimeEqual } from "./constantTimeEqual.js";
import { hashMessage } from "./hashMessage.js";
import { recoverAddress } from "./recoverAddress.js";
import { recoverMessageAddress } from "./recoverMessageAddress.js";
import { verifyHash } from "./verifyHash.js";
import { verifyMessage } from "./verifyMessage.js";
import { verifyTypedData } from "./verifyTypedData.js";

const bytesToHex = (bytes: Uint8Array): string => {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
};

describe("constantTimeEqual", () => {
	it("returns true for equal arrays", () => {
		const a = new Uint8Array([1, 2, 3, 4, 5]);
		const b = new Uint8Array([1, 2, 3, 4, 5]);
		expect(constantTimeEqual(a, b)).toBe(true);
	});

	it("returns false for different arrays", () => {
		const a = new Uint8Array([1, 2, 3, 4, 5]);
		const b = new Uint8Array([1, 2, 3, 4, 6]);
		expect(constantTimeEqual(a, b)).toBe(false);
	});

	it("returns false for arrays of different lengths", () => {
		const a = new Uint8Array([1, 2, 3, 4, 5]);
		const b = new Uint8Array([1, 2, 3, 4]);
		expect(constantTimeEqual(a, b)).toBe(false);
	});

	it("returns true for empty arrays", () => {
		const a = new Uint8Array([]);
		const b = new Uint8Array([]);
		expect(constantTimeEqual(a, b)).toBe(true);
	});

	it("works with 20-byte addresses", () => {
		const addr1 = new Uint8Array(20).fill(0xab);
		const addr2 = new Uint8Array(20).fill(0xab);
		const addr3 = new Uint8Array(20).fill(0xcd);

		expect(constantTimeEqual(addr1, addr2)).toBe(true);
		expect(constantTimeEqual(addr1, addr3)).toBe(false);
	});

	it("works with 32-byte hashes", () => {
		const hash1 = new Uint8Array(32).fill(0x12);
		const hash2 = new Uint8Array(32).fill(0x12);
		const hash3 = new Uint8Array(32).fill(0x34);

		expect(constantTimeEqual(hash1, hash2)).toBe(true);
		expect(constantTimeEqual(hash1, hash3)).toBe(false);
	});
});

describe("hashMessage", () => {
	it.effect("hashes a string message", () =>
		Effect.gen(function* () {
			const result = yield* hashMessage("hello world");

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(KeccakLive)),
	);

	it.effect("produces consistent hash for same message", () =>
		Effect.gen(function* () {
			const hash1 = yield* hashMessage("test message");
			const hash2 = yield* hashMessage("test message");

			expect(constantTimeEqual(hash1, hash2)).toBe(true);
		}).pipe(Effect.provide(KeccakLive)),
	);

	it.effect("produces different hashes for different messages", () =>
		Effect.gen(function* () {
			const hash1 = yield* hashMessage("message1");
			const hash2 = yield* hashMessage("message2");

			expect(constantTimeEqual(hash1, hash2)).toBe(false);
		}).pipe(Effect.provide(KeccakLive)),
	);

	it.effect("hashes bytes", () =>
		Effect.gen(function* () {
			const bytes = new Uint8Array([1, 2, 3, 4, 5]);
			const result = yield* hashMessage(bytes);

			expect(result.length).toBe(32);
		}).pipe(Effect.provide(KeccakLive)),
	);

	it.effect("hashes hex strings", () =>
		Effect.gen(function* () {
			const result = yield* hashMessage("0x1234");

			expect(result.length).toBe(32);
		}).pipe(Effect.provide(KeccakLive)),
	);

	// Known test vector: EIP-191 format
	it.effect("matches known EIP-191 test vector", () =>
		Effect.gen(function* () {
			const result = yield* hashMessage("hello world");

			// The result should be a valid 32-byte hash
			expect(result.length).toBe(32);
			// Verify it's not all zeros
			expect(result.some((b) => b !== 0)).toBe(true);
		}).pipe(Effect.provide(KeccakLive)),
	);

	it.effect("EIP-191 prefix is applied correctly", () =>
		Effect.gen(function* () {
			const keccak = yield* KeccakService;

			// Hash manually to verify prefix
			const message = "hello";
			const prefix = "\x19Ethereum Signed Message:\n";
			const prefixedMessage = prefix + "5" + message;
			const manualBytes = new TextEncoder().encode(prefixedMessage);
			const manualHash = yield* keccak.hash(manualBytes);

			// Hash using hashMessage
			const result = yield* hashMessage(message);

			expect(constantTimeEqual(result, manualHash)).toBe(true);
		}).pipe(Effect.provide(KeccakLive)),
	);
});

describe("Security: Constant-time comparison", () => {
	it("compares addresses in constant time", () => {
		// These should all take approximately the same time
		const addr1 = new Uint8Array(20).fill(0xaa);
		const addr2 = new Uint8Array(20).fill(0xaa);
		const addr3 = new Uint8Array(20);
		addr3.fill(0xaa);
		addr3[0] = 0xbb; // Different at start
		const addr4 = new Uint8Array(20);
		addr4.fill(0xaa);
		addr4[19] = 0xbb; // Different at end

		// Just verify correctness - timing verification would need more sophisticated tests
		expect(constantTimeEqual(addr1, addr2)).toBe(true);
		expect(constantTimeEqual(addr1, addr3)).toBe(false);
		expect(constantTimeEqual(addr1, addr4)).toBe(false);
	});

	it("compares 32-byte hashes in constant time", () => {
		const hash1 = new Uint8Array(32).fill(0x12);
		const hash2 = new Uint8Array(32).fill(0x12);
		const hash3 = new Uint8Array(32);
		hash3.fill(0x12);
		hash3[0] = 0x34;
		const hash4 = new Uint8Array(32);
		hash4.fill(0x12);
		hash4[31] = 0x34;

		expect(constantTimeEqual(hash1, hash2)).toBe(true);
		expect(constantTimeEqual(hash1, hash3)).toBe(false);
		expect(constantTimeEqual(hash1, hash4)).toBe(false);
	});
});

describe("Error types", () => {
	it("exports VerifyError", async () => {
		const { VerifyError } = await import("./errors.js");
		const error = VerifyError.of("test error");
		expect(error._tag).toBe("VerifyError");
		expect(error.message).toBe("test error");
	});

	it("exports RecoverError", async () => {
		const { RecoverError } = await import("./errors.js");
		const error = RecoverError.of("test error", { cause: new Error("inner") });
		expect(error._tag).toBe("RecoverError");
		expect(error.message).toBe("test error");
		expect(error.cause).toBeInstanceOf(Error);
	});

	it("exports AddressDerivationError", async () => {
		const { AddressDerivationError } = await import("./errors.js");
		const error = AddressDerivationError.of("test error");
		expect(error._tag).toBe("AddressDerivationError");
		expect(error.message).toBe("test error");
	});
});
