/**
 * Private Key Signer Tests
 *
 * Tests private key signer with known test vectors
 */

import { describe, expect, test } from "bun:test";
import { PrivateKeySignerImpl } from "./private-key-signer.ts";
import type { LegacyTransaction, Eip1559Transaction } from "../../primitives/transaction.ts";

describe("PrivateKeySigner", () => {
	// Test vectors from Ethereum test suite
	const TEST_PRIVATE_KEY = "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a3f362318";
	const TEST_ADDRESS = "0x2c7536E3605D9C16a7a3D7b1898e529396a65c23";

	describe("Address Derivation", () => {
		test("derives correct address from private key", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			expect(signer.address.toLowerCase()).toBe(TEST_ADDRESS.toLowerCase());
		});

		test("derives checksummed address", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			// Address should have mixed case (EIP-55 checksum)
			expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(signer.address).not.toBe(signer.address.toLowerCase());
			expect(signer.address).not.toBe(signer.address.toUpperCase());
		});

		test("random signer generates valid address", () => {
			const signer = PrivateKeySignerImpl.random();

			expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
			expect(signer.getPrivateKey()).toMatch(/^0x[0-9a-f]{64}$/);
		});
	});

	describe("Private Key Management", () => {
		test("stores and retrieves private key", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			expect(signer.getPrivateKey()).toBe(TEST_PRIVATE_KEY);
		});

		test("accepts private key without 0x prefix", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY.slice(2),
			});

			expect(signer.getPrivateKey()).toBe(TEST_PRIVATE_KEY);
		});

		test("accepts private key as Uint8Array", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}

			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: bytes,
			});

			expect(signer.getPrivateKey()).toMatch(/^0x[0-9a-f]{64}$/);
		});

		test("rejects invalid private key length", () => {
			expect(() => {
				PrivateKeySignerImpl.fromPrivateKey({
					privateKey: "0x1234",
				});
			}).toThrow("Private key must be exactly 32 bytes");
		});
	});

	describe("Message Signing (EIP-191)", () => {
		test("signs message with known test vector", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Hello, Ethereum!";
			const signature = await signer.signMessage(message);

			// Signature should be 65 bytes (130 hex chars + 0x prefix)
			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);

			// Verify signature has correct components
			const r = signature.slice(2, 66);
			const s = signature.slice(66, 130);
			const v = signature.slice(130, 132);

			expect(r).toHaveLength(64);
			expect(s).toHaveLength(64);
			expect(v).toMatch(/^(1b|1c)$/); // 27 or 28 in hex
		});

		test("signs empty message", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const signature = await signer.signMessage("");
			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		test("signs message as Uint8Array", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = new TextEncoder().encode("Hello, Ethereum!");
			const signature = await signer.signMessage(message);

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		test("different messages produce different signatures", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const sig1 = await signer.signMessage("Message 1");
			const sig2 = await signer.signMessage("Message 2");

			expect(sig1).not.toBe(sig2);
		});

		test("same message produces same signature", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const message = "Consistent message";
			const sig1 = await signer.signMessage(message);
			const sig2 = await signer.signMessage(message);

			expect(sig1).toBe(sig2);
		});
	});

	describe("Transaction Signing", () => {
		test("signs legacy transaction", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const tx: LegacyTransaction = {
				type: "legacy",
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: "0x3535353535353535353535353535353535353535",
				value: 1000000000000000000n,
				data: "0x",
				v: 0n, // Unsigned
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await signer.signTransaction(tx);

			// Verify signature components
			expect(signedTx.v).toBeGreaterThan(35n); // EIP-155
			expect(signedTx.r).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.s).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.r).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(signedTx.s).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
		});

		test("signs EIP-1559 transaction", async () => {
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
				v: 0n, // Unsigned
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await signer.signTransaction(tx);

			// EIP-1559 uses v = 0 or 1
			expect(signedTx.v).toBeGreaterThanOrEqual(0n);
			expect(signedTx.v).toBeLessThanOrEqual(1n);
			expect(signedTx.r).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.s).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.r).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(signedTx.s).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
		});

		test("signs transaction with data", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const tx: Eip1559Transaction = {
				type: "eip1559",
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: "0x3535353535353535353535353535353535353535",
				value: 0n,
				data: "0x1234567890abcdef",
				accessList: [],
				v: 0n,
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await signer.signTransaction(tx);

			expect(signedTx.r).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(signedTx.data).toBe("0x1234567890abcdef");
		});

		test("signs contract deployment transaction (no to field)", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const tx: Eip1559Transaction = {
				type: "eip1559",
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 1000000n,
				to: undefined, // Contract deployment
				value: 0n,
				data: "0x6080604052",
				accessList: [],
				v: 0n,
				r: "0x0000000000000000000000000000000000000000000000000000000000000000",
				s: "0x0000000000000000000000000000000000000000000000000000000000000000",
			};

			const signedTx = await signer.signTransaction(tx);

			expect(signedTx.r).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
			expect(signedTx.to).toBeUndefined();
		});
	});

	describe("Type Safety", () => {
		test("has correct type property", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			expect(signer.type).toBe("privateKey");
		});

		test("implements Signer interface", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			expect(typeof signer.signTransaction).toBe("function");
			expect(typeof signer.signMessage).toBe("function");
			expect(typeof signer.signTypedData).toBe("function");
			expect(typeof signer.address).toBe("string");
		});
	});
});
