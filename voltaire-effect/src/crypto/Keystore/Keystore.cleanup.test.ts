/**
 * @fileoverview Tests verifying memory cleanup for decrypted keys in Keystore.
 */
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as Keystore from "./index.js";

describe("withDecryptedKey memory cleanup", () => {
	const testPrivateKey = new Uint8Array([
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
		0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
		0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
	]) as any;

	const testPassword = "test-password-123";

	it("zeroes decrypted key after normal use", async () => {
		const encrypted = await Effect.runPromise(
			Keystore.encrypt(testPrivateKey, testPassword, {
				scryptN: 1024,
				scryptR: 8,
				scryptP: 1,
			}),
		);

		let capturedKey: Uint8Array | null = null;

		await Effect.runPromise(
			Keystore.withDecryptedKey(encrypted, testPassword, (key) =>
				Effect.sync(() => {
					capturedKey = key;
					expect(key).toEqual(testPrivateKey);
				}),
			),
		);

		expect(capturedKey).not.toBeNull();
		expect(capturedKey!.every((b) => b === 0)).toBe(true);
	});

	it("zeroes decrypted key even when use effect fails", async () => {
		const encrypted = await Effect.runPromise(
			Keystore.encrypt(testPrivateKey, testPassword, {
				scryptN: 1024,
				scryptR: 8,
				scryptP: 1,
			}),
		);

		let capturedKey: Uint8Array | null = null;

		const exit = await Effect.runPromiseExit(
			Keystore.withDecryptedKey(encrypted, testPassword, (key) =>
				Effect.sync(() => {
					capturedKey = key;
					throw new Error("deliberate test error");
				}),
			),
		);

		expect(Exit.isFailure(exit)).toBe(true);
		expect(capturedKey).not.toBeNull();
		expect(capturedKey!.every((b) => b === 0)).toBe(true);
	});

	it("does not call use when password is wrong", async () => {
		const encrypted = await Effect.runPromise(
			Keystore.encrypt(testPrivateKey, testPassword, {
				scryptN: 1024,
				scryptR: 8,
				scryptP: 1,
			}),
		);

		let useCalled = false;

		const exit = await Effect.runPromiseExit(
			Keystore.withDecryptedKey(encrypted, "wrong-password", (_key) =>
				Effect.sync(() => {
					useCalled = true;
				}),
			),
		);

		expect(Exit.isFailure(exit)).toBe(true);
		expect(useCalled).toBe(false);
	});
});
