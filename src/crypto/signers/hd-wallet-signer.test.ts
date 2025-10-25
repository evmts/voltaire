/**
 * HD Wallet Signer Tests
 *
 * Tests HD wallet signer with BIP-39/44 test vectors
 */

import { describe, expect, test } from "bun:test";
import { HDWalletSignerImpl } from "./hd-wallet-signer.ts";
import type { Eip1559Transaction } from "../../primitives/transaction.ts";

describe("HDWalletSigner", () => {
	// Standard BIP-39 test vector
	const TEST_MNEMONIC = "test test test test test test test test test test test junk";

	// Expected addresses for the test mnemonic (verified with ethers.js)
	// Derivation path: m/44'/60'/0'/0/0
	const EXPECTED_ADDRESS_0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
	// Derivation path: m/44'/60'/0'/0/1
	const EXPECTED_ADDRESS_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

	describe("Mnemonic Management", () => {
		test("creates signer from valid mnemonic", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			expect(signer.getMnemonic()).toBe(TEST_MNEMONIC);
			expect(signer.type).toBe("hdWallet");
		});

		test("rejects invalid mnemonic", () => {
			expect(() => {
				HDWalletSignerImpl.fromMnemonic({
					mnemonic: "invalid mnemonic phrase that does not pass checksum",
				});
			}).toThrow("Invalid mnemonic phrase");
		});

		test("handles mnemonic with extra whitespace", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: `  ${TEST_MNEMONIC}  `,
			});

			expect(signer.getMnemonic()).toBe(TEST_MNEMONIC);
		});

		test("generates random mnemonic", () => {
			const signer = HDWalletSignerImpl.generate(12);

			const mnemonic = signer.getMnemonic();
			const words = mnemonic.split(" ");

			expect(words).toHaveLength(12);
			expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		test("generates 24-word mnemonic", () => {
			const signer = HDWalletSignerImpl.generate(24);

			const mnemonic = signer.getMnemonic();
			const words = mnemonic.split(" ");

			expect(words).toHaveLength(24);
		});

		test("supports optional passphrase", () => {
			const signer1 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				passphrase: "",
			});

			const signer2 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				passphrase: "secret",
			});

			// Different passphrases should produce different addresses
			expect(signer1.address).not.toBe(signer2.address);
		});
	});

	describe("BIP-44 Derivation", () => {
		test("derives correct address at index 0", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			expect(signer.address.toLowerCase()).toBe(EXPECTED_ADDRESS_0.toLowerCase());
			expect(signer.index).toBe(0);
			expect(signer.path).toBe("m/44'/60'/0'/0");
		});

		test("derives correct address at index 1", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 1,
			});

			expect(signer.address.toLowerCase()).toBe(EXPECTED_ADDRESS_1.toLowerCase());
			expect(signer.index).toBe(1);
		});

		test("derives multiple addresses from same mnemonic", async () => {
			const signer0 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const signer1 = await signer0.deriveIndex(1);
			const signer2 = await signer0.deriveIndex(2);

			// All addresses should be different
			expect(signer0.address).not.toBe(signer1.address);
			expect(signer1.address).not.toBe(signer2.address);
			expect(signer0.address).not.toBe(signer2.address);

			// Verify known addresses
			expect(signer0.address.toLowerCase()).toBe(EXPECTED_ADDRESS_0.toLowerCase());
			expect(signer1.address.toLowerCase()).toBe(EXPECTED_ADDRESS_1.toLowerCase());
		});

		test("supports custom derivation path", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				path: "m/44'/60'/0'/0",
				index: 0,
			});

			expect(signer.path).toBe("m/44'/60'/0'/0");
			expect(signer.address.toLowerCase()).toBe(EXPECTED_ADDRESS_0.toLowerCase());
		});

		test("derives at custom path", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			const customSigner = await signer.derivePath("m/44'/60'/0'/0/5");

			expect(customSigner.path).toBe("m/44'/60'/0'/0");
			expect(customSigner.index).toBe(5);
			expect(customSigner.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		test("rejects invalid derivation path", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			await expect(signer.derivePath("invalid/path")).rejects.toThrow(
				"Path must start with 'm/'",
			);
		});

		test("rejects negative index", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			await expect(signer.deriveIndex(-1)).rejects.toThrow(
				"Index must be non-negative",
			);
		});
	});

	describe("Message Signing", () => {
		test("signs message at index 0", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const message = "Hello, HD Wallet!";
			const signature = await signer.signMessage(message);

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		test("different indices produce different signatures", async () => {
			const signer0 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const signer1 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 1,
			});

			const message = "Test message";
			const sig0 = await signer0.signMessage(message);
			const sig1 = await signer1.signMessage(message);

			expect(sig0).not.toBe(sig1);
		});

		test("same index produces same signature", async () => {
			const signer1 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const signer2 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const message = "Consistent message";
			const sig1 = await signer1.signMessage(message);
			const sig2 = await signer2.signMessage(message);

			expect(sig1).toBe(sig2);
		});
	});

	describe("Transaction Signing", () => {
		test("signs transaction with HD wallet", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
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

			expect(signedTx.v).toBeGreaterThanOrEqual(0n);
			expect(signedTx.v).toBeLessThanOrEqual(1n);
			expect(signedTx.r).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.s).toMatch(/^0x[0-9a-f]{64}$/);
			expect(signedTx.r).not.toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
		});

		test("different indices produce different transaction signatures", async () => {
			const signer0 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const signer1 = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 1,
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

			const signedTx0 = await signer0.signTransaction(tx);
			const signedTx1 = await signer1.signTransaction(tx);

			// Different signers should produce different signatures
			expect(signedTx0.r).not.toBe(signedTx1.r);
		});
	});

	describe("Type Safety", () => {
		test("has correct type property", () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			expect(signer.type).toBe("hdWallet");
		});

		test("implements HDWalletSigner interface", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
			});

			expect(typeof signer.signTransaction).toBe("function");
			expect(typeof signer.signMessage).toBe("function");
			expect(typeof signer.signTypedData).toBe("function");
			expect(typeof signer.getMnemonic).toBe("function");
			expect(typeof signer.deriveIndex).toBe("function");
			expect(typeof signer.derivePath).toBe("function");
			expect(typeof signer.address).toBe("string");
			expect(typeof signer.path).toBe("string");
			expect(typeof signer.index).toBe("number");
		});
	});

	describe("Deterministic Behavior", () => {
		test("same mnemonic and index always produce same address", () => {
			const signers = Array.from({ length: 10 }, () =>
				HDWalletSignerImpl.fromMnemonic({
					mnemonic: TEST_MNEMONIC,
					index: 0,
				})
			);

			const addresses = signers.map(s => s.address);
			const uniqueAddresses = new Set(addresses);

			expect(uniqueAddresses.size).toBe(1);
			expect(addresses[0]?.toLowerCase()).toBe(EXPECTED_ADDRESS_0.toLowerCase());
		});

		test("incremental indices produce deterministic sequence", async () => {
			const signer = HDWalletSignerImpl.fromMnemonic({
				mnemonic: TEST_MNEMONIC,
				index: 0,
			});

			const addresses: string[] = [];
			for (let i = 0; i < 5; i++) {
				const derivedSigner = await signer.deriveIndex(i);
				addresses.push(derivedSigner.address);
			}

			// Verify addresses are deterministic by deriving again
			const addresses2: string[] = [];
			for (let i = 0; i < 5; i++) {
				const derivedSigner = await signer.deriveIndex(i);
				addresses2.push(derivedSigner.address);
			}

			expect(addresses).toEqual(addresses2);
		});
	});
});
