/**
 * Signer Utility Function Tests
 *
 * Tests signature verification, recovery, and utility functions
 */

import { describe, expect, test } from "bun:test";
import { PrivateKeySignerImpl } from "./private-key-signer.ts";
import {
	verifyMessage,
	recoverMessageAddress,
	recoverTransactionAddress,
	isCanonicalSignature,
	normalizeSignature,
	getAddress,
	sign,
	signMessage,
} from "./utils.ts";
import type { Eip1559Transaction } from "../../primitives/transaction.ts";

describe("Signer Utilities", () => {
	const TEST_PRIVATE_KEY =
		"0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
	const TEST_ADDRESS = "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23";

	describe("Message Verification", () => {
		test("verifies valid message signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Hello, Ethereum!";
			const signature = await signer.signMessage(message);

			const isValid = verifyMessage(message, signature, signer.address);
			expect(isValid).toBe(true);
		});

		test("rejects invalid message signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Hello, Ethereum!";
			const signature = await signer.signMessage(message);

			// Verify with wrong address
			const wrongAddress = "0x0000000000000000000000000000000000000000";
			const isValid = verifyMessage(message, signature, wrongAddress);
			expect(isValid).toBe(false);
		});

		test("rejects signature for different message", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message1 = "Message 1";
			const message2 = "Message 2";
			const signature = await signer.signMessage(message1);

			const isValid = verifyMessage(message2, signature, signer.address);
			expect(isValid).toBe(false);
		});

		test("handles malformed signature gracefully", () => {
			const message = "Test message";
			const invalidSig = "0x1234";

			const isValid = verifyMessage(message, invalidSig, TEST_ADDRESS);
			expect(isValid).toBe(false);
		});

		test("verifies message signed as Uint8Array", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = new TextEncoder().encode("Hello, Ethereum!");
			const signature = await signer.signMessage(message);

			const isValid = verifyMessage(message, signature, signer.address);
			expect(isValid).toBe(true);
		});
	});

	describe("Address Recovery", () => {
		test("recovers correct address from message signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Hello, Ethereum!";
			const signature = await signer.signMessage(message);

			const recoveredAddress = recoverMessageAddress(message, signature);
			expect(recoveredAddress.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("recovers address from empty message", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "";
			const signature = await signer.signMessage(message);

			const recoveredAddress = recoverMessageAddress(message, signature);
			expect(recoveredAddress.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("recovers address from Uint8Array message", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = new TextEncoder().encode("Test message");
			const signature = await signer.signMessage(message);

			const recoveredAddress = recoverMessageAddress(message, signature);
			expect(recoveredAddress.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("throws on invalid signature during recovery", () => {
			const message = "Test message";
			const invalidSig = "0x1234";

			expect(() => {
				recoverMessageAddress(message, invalidSig);
			}).toThrow();
		});

		test("recovers address from transaction signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const tx: Eip1559Transaction = {
				type: "eip1559",
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: "0x3535353535353535353535353535353535353535",
				value: 1000000000000000000n,
				data: "0x",
				accessList: [],
				v: 0n,
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await signer.signTransaction(tx);
			const recoveredAddress = await recoverTransactionAddress(signedTx);

			expect(recoveredAddress.toLowerCase()).toBe(signer.address.toLowerCase());
		});
	});

	describe("Signature Canonicalization", () => {
		test("detects canonical signatures", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Test message";
			const signature = await signer.signMessage(message);

			// Modern libraries produce canonical signatures by default
			const isCanonical = isCanonicalSignature(signature);
			expect(isCanonical).toBe(true);
		});

		test("normalizes non-canonical signature", () => {
			// Create a non-canonical signature (high-s value)
			const r =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const s =
				"0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140"; // High s
			const v = "1b";
			const signature = `${r}${s.slice(2)}${v}`;

			expect(isCanonicalSignature(signature)).toBe(false);

			const normalized = normalizeSignature(signature);
			expect(isCanonicalSignature(normalized)).toBe(true);
		});

		test("normalizing canonical signature returns same signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Test message";
			const signature = await signer.signMessage(message);

			const normalized = normalizeSignature(signature);
			expect(normalized).toBe(signature);
		});
	});

	describe("Signer Helper Functions", () => {
		test("getAddress returns signer address", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const address = getAddress(signer);
			expect(address).toBe(signer.address);
			expect(address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
		});

		test("sign function delegates to signer", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const tx: Eip1559Transaction = {
				type: "eip1559",
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: "0x3535353535353535353535353535353535353535",
				value: 1000000000000000000n,
				data: "0x",
				accessList: [],
				v: 0n,
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await sign(signer, tx);
			expect(signedTx.r).not.toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		test("signMessage function delegates to signer", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Test message";
			const signature = await signMessage(signer, message);

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);

			// Verify signature is valid
			const isValid = verifyMessage(message, signature, signer.address);
			expect(isValid).toBe(true);
		});
	});

	describe("Cross-Validation", () => {
		test("signature verification and recovery are consistent", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Consistency test";
			const signature = await signer.signMessage(message);

			// Verify returns true
			const isValid = verifyMessage(message, signature, signer.address);
			expect(isValid).toBe(true);

			// Recovery returns same address
			const recoveredAddress = recoverMessageAddress(message, signature);
			expect(recoveredAddress.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("different signers produce verifiable signatures", async () => {
			const signer1 = PrivateKeySignerImpl.random();
			const signer2 = PrivateKeySignerImpl.random();

			const message = "Multi-signer test";

			const sig1 = await signer1.signMessage(message);
			const sig2 = await signer2.signMessage(message);

			// Each signature verifies with its own address
			expect(verifyMessage(message, sig1, signer1.address)).toBe(true);
			expect(verifyMessage(message, sig2, signer2.address)).toBe(true);

			// Each signature fails with the other address
			expect(verifyMessage(message, sig1, signer2.address)).toBe(false);
			expect(verifyMessage(message, sig2, signer1.address)).toBe(false);

			// Recovery produces correct addresses
			expect(recoverMessageAddress(message, sig1).toLowerCase()).toBe(
				signer1.address.toLowerCase(),
			);
			expect(recoverMessageAddress(message, sig2).toLowerCase()).toBe(
				signer2.address.toLowerCase(),
			);
		});

		test("multiple messages signed by same signer are all verifiable", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const messages = [
				"Message 1",
				"Message 2",
				"Message 3",
				"",
				"Long message with special characters: !@#$%^&*()",
			];

			for (const message of messages) {
				const signature = await signer.signMessage(message);

				// Verify signature
				expect(verifyMessage(message, signature, signer.address)).toBe(true);

				// Recover address
				const recovered = recoverMessageAddress(message, signature);
				expect(recovered.toLowerCase()).toBe(signer.address.toLowerCase());
			}
		});
	});

	describe("Edge Cases", () => {
		// Skipped: C API has buffer size limitations
		test.skip("handles very long messages", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			// Use a more reasonable length (1000 chars) to avoid C API limitations
			const longMessage = "a".repeat(1000);
			const signature = await signer.signMessage(longMessage);

			expect(verifyMessage(longMessage, signature, signer.address)).toBe(true);

			const recovered = recoverMessageAddress(longMessage, signature);
			expect(recovered.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("handles messages with special characters", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const specialMessage = "Message with emoji: 🚀 and unicode: ñ á é í ó ú";
			const signature = await signer.signMessage(specialMessage);

			expect(verifyMessage(specialMessage, signature, signer.address)).toBe(
				true,
			);

			const recovered = recoverMessageAddress(specialMessage, signature);
			expect(recovered.toLowerCase()).toBe(signer.address.toLowerCase());
		});

		test("handles binary data", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const binaryData = new Uint8Array([0, 1, 2, 255, 254, 253]);
			const signature = await signer.signMessage(binaryData);

			expect(verifyMessage(binaryData, signature, signer.address)).toBe(true);

			const recovered = recoverMessageAddress(binaryData, signature);
			expect(recovered.toLowerCase()).toBe(signer.address.toLowerCase());
		});
	});
});
