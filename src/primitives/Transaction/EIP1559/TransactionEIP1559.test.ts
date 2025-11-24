import { describe, expect, it } from "vitest";
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import { PrivateKey } from "../../../crypto/Secp256k1/index.js";
import { Address } from "../../Address/index.js";
import { Type } from "../types.js";
import { TransactionEIP1559 } from "./index.js";

describe("TransactionEIP1559", () => {
	describe("factory function", () => {
		it("creates transaction with all fields", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.type).toBe(Type.EIP1559);
			expect(tx.chainId).toBe(1n);
			expect(tx.nonce).toBe(0n);
			expect(tx.maxPriorityFeePerGas).toBe(1000000000n);
			expect(tx.maxFeePerGas).toBe(20000000000n);
			expect(tx.gasLimit).toBe(21000n);
			expect(tx.to).toBe(Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"));
			expect(tx.value).toBe(1000000000000000000n);
			expect(tx.data).toBeInstanceOf(Uint8Array);
			expect(tx.accessList).toEqual([]);
			expect(tx.yParity).toBe(0);
			expect(tx.r).toBeInstanceOf(Uint8Array);
			expect(tx.s).toBeInstanceOf(Uint8Array);
		});

		it("creates contract creation transaction (to = null)", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 1000000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.to).toBe(null);
			expect(tx.data.length).toBeGreaterThan(0);
		});

		it("creates transaction with access list", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [
					{
						address: Address("0x1234567890123456789012345678901234567890"),
						storageKeys: [
							new Uint8Array(32).fill(1),
							new Uint8Array(32).fill(2),
						],
					},
				],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.accessList.length).toBe(1);
			expect(tx.accessList[0].storageKeys.length).toBe(2);
		});

		it("creates transaction with zero values", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 0n,
				maxFeePerGas: 0n,
				gasLimit: 21000n,
				to: Address("0x0000000000000000000000000000000000000000"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			expect(tx.maxPriorityFeePerGas).toBe(0n);
			expect(tx.maxFeePerGas).toBe(0n);
			expect(tx.value).toBe(0n);
		});

		it("creates transaction with large data", () => {
			const largeData = new Uint8Array(10000).fill(0xff);
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 5000000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: largeData,
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			expect(tx.data.length).toBe(10000);
		});
	});

	describe("static methods", () => {
		it("has serialize method", () => {
			expect(typeof TransactionEIP1559.serialize).toBe("function");
		});

		it("has hash method", () => {
			expect(typeof TransactionEIP1559.hash).toBe("function");
		});

		it("has getSigningHash method", () => {
			expect(typeof TransactionEIP1559.getSigningHash).toBe("function");
		});

		it("has getSender method", () => {
			expect(typeof TransactionEIP1559.getSender).toBe("function");
		});

		it("has verifySignature method", () => {
			expect(typeof TransactionEIP1559.verifySignature).toBe("function");
		});

		it("has getEffectiveGasPrice method", () => {
			expect(typeof TransactionEIP1559.getEffectiveGasPrice).toBe("function");
		});

		it("has deserialize method", () => {
			expect(typeof TransactionEIP1559.deserialize).toBe("function");
		});
	});

	describe("prototype methods", () => {
		const createTx = () =>
			TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

		it("instance has serialize method", () => {
			const tx = createTx();
			expect(typeof tx.serialize).toBe("function");
		});

		it("instance has hash method", () => {
			const tx = createTx();
			expect(typeof tx.hash).toBe("function");
		});

		it("instance has getSigningHash method", () => {
			const tx = createTx();
			expect(typeof tx.getSigningHash).toBe("function");
		});

		it("instance has getSender method", () => {
			const tx = createTx();
			expect(typeof tx.getSender).toBe("function");
		});

		it("instance has verifySignature method", () => {
			const tx = createTx();
			expect(typeof tx.verifySignature).toBe("function");
		});

		it("instance has getEffectiveGasPrice method", () => {
			const tx = createTx();
			expect(typeof tx.getEffectiveGasPrice).toBe("function");
		});
	});

	describe("round-trip operations", () => {
		it("serializes and deserializes correctly", () => {
			const original = TransactionEIP1559({
				chainId: 1n,
				nonce: 5n,
				maxPriorityFeePerGas: 2000000000n,
				maxFeePerGas: 30000000000n,
				gasLimit: 50000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			const serialized = TransactionEIP1559.serialize(original);
			const deserialized = TransactionEIP1559.deserialize(serialized);

			expect(deserialized.type).toBe(original.type);
			expect(deserialized.chainId).toBe(original.chainId);
			expect(deserialized.nonce).toBe(original.nonce);
			expect(deserialized.maxPriorityFeePerGas).toBe(
				original.maxPriorityFeePerGas,
			);
			expect(deserialized.maxFeePerGas).toBe(original.maxFeePerGas);
			expect(deserialized.gasLimit).toBe(original.gasLimit);
			expect(deserialized.value).toBe(original.value);
		});

		it("computes consistent hash", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			const hash1 = TransactionEIP1559.hash(tx);
			const hash2 = TransactionEIP1559.hash(tx);

			expect(hash1).toEqual(hash2);
		});
	});

	describe("signature verification workflow", () => {
		it("signs and verifies transaction", () => {
			const privateKey = PrivateKey.from(
				"0x0123456789012345678901234567890123456789012345678901234567890123",
			);
			const publicKey = Secp256k1.getPublicKey(privateKey);
			const expectedAddress = Address.fromPublicKey(publicKey);

			const unsignedTx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
			const signature = Secp256k1.sign(signingHash, privateKey);

			const signedTx = TransactionEIP1559({
				...unsignedTx,
				yParity: signature.v - 27,
				r: signature.r,
				s: signature.s,
			});

			const isValid = TransactionEIP1559.verifySignature(signedTx);
			expect(isValid).toBe(true);

			const recoveredAddress = TransactionEIP1559.getSender(signedTx);
			expect(Address.toHex(recoveredAddress)).toBe(
				Address.toHex(expectedAddress),
			);
		});

		it("detects tampered signature", () => {
			const privateKey = PrivateKey.from(
				"0x0123456789012345678901234567890123456789012345678901234567890123",
			);

			const unsignedTx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			});

			const signingHash = TransactionEIP1559.getSigningHash(unsignedTx);
			const signature = Secp256k1.sign(signingHash, privateKey);

			const tamperedTx = TransactionEIP1559({
				...unsignedTx,
				value: 2000000000000000000n,
				yParity: signature.v - 27,
				r: signature.r,
				s: signature.s,
			});

			const isValid = TransactionEIP1559.verifySignature(tamperedTx);
			expect(isValid).toBe(false);
		});

		it("computes effective gas price", () => {
			const tx = TransactionEIP1559({
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 2000000000n,
				maxFeePerGas: 30000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			});

			const baseFee = 20000000000n;
			const effectivePrice = TransactionEIP1559.getEffectiveGasPrice(
				tx,
				baseFee,
			);

			expect(effectivePrice).toBe(22000000000n);
		});
	});
});
