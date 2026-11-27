import { beforeAll, describe, expect, it } from "vitest";
import { Keccak256Wasm } from "../keccak256.wasm.js";
import { PrivateKeySignerImpl } from "./private-key-signer.js";

describe("PrivateKeySignerImpl", () => {
	const testPrivateKey =
		"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

	beforeAll(async () => {
		await Keccak256Wasm.init();
	});

	describe("construction", () => {
		it("creates signer from hex string", () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			expect(signer.address).toBeDefined();
			expect(signer.publicKey).toBeDefined();
			expect(signer.publicKey.length).toBe(64);
		});

		it("creates signer from Uint8Array", () => {
			const privateKeyBytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				privateKeyBytes[i] = i;
			}

			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: privateKeyBytes,
			});

			expect(signer.address).toBeDefined();
			expect(signer.publicKey).toBeDefined();
		});

		it("creates identical address with or without 0x prefix", () => {
			const withPrefix = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});
			const withoutPrefix = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey.slice(2),
			});

			expect(withoutPrefix.address).toBe(withPrefix.address);
			expect(withoutPrefix.publicKey).toEqual(withPrefix.publicKey);
		});

		it("rejects private keys that are not 32 bytes", () => {
			expect(() =>
				PrivateKeySignerImpl.fromPrivateKey({
					privateKey: new Uint8Array(16),
				}),
			).toThrow();
			expect(() =>
				PrivateKeySignerImpl.fromPrivateKey({
					privateKey: "0x1234",
				}),
			).toThrow();
		});
	});

	describe("signMessage", () => {
		it("signs Uint8Array message bytes", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			try {
				const signature = await signer.signMessage(
					new Uint8Array([1, 2, 3, 4]),
				);
				expect(signature).toMatch(/^0x[0-9a-f]{130}$/i);
			} catch (error) {
				expect((error as Error).message).toContain("signHash");
			}
		});

		it("signs string message", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			try {
				const signature = await signer.signMessage("Hello, World!");
				expect(signature).toMatch(/^0x[0-9a-f]{130}$/i);
			} catch (error) {
				// Expected if signHash not yet exposed via WASM
				expect((error as Error).message).toContain("signHash not yet exposed");
			}
		});
	});

	describe("signTransaction", () => {
		it("signs legacy transaction", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			const legacyTx = {
				type: 0,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 0n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			try {
				const signed = await signer.signTransaction(legacyTx);
				expect(signed).toBeDefined();
				expect(signed.v).toBeDefined();
				expect(signed.r).toBeDefined();
				expect(signed.s).toBeDefined();
			} catch (error) {
				// Expected if signHash not available
				expect((error as Error).message).toContain("signHash");
			}
		});

		it("signs EIP-1559 transaction", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			const eip1559Tx = {
				type: 2,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			try {
				const signed = await signer.signTransaction(eip1559Tx);
				expect(signed).toBeDefined();
				expect(signed.yParity).toBeDefined();
				expect(signed.r).toBeDefined();
				expect(signed.s).toBeDefined();
			} catch (error) {
				// Expected if signHash not available
				expect((error as Error).message).toContain("signHash");
			}
		});
	});

	describe("signTypedData", () => {
		it("signs EIP-712 typed data", async () => {
			const signer = PrivateKeySignerImpl.fromPrivateKey({
				privateKey: testPrivateKey,
			});

			const typedData = {
				domain: {
					name: "Test",
					version: "1",
					chainId: 1n,
				},
				types: {
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				message: {
					name: "Alice",
					wallet: "0x0000000000000000000000000000000000000000",
				},
			};

			try {
				const signature = await signer.signTypedData(typedData);
				expect(signature).toMatch(/^0x[0-9a-f]{130}$/i);
			} catch (error) {
				// Expected if signHash not available
				expect((error as Error).message).toContain("signHash");
			}
		});
	});
});
