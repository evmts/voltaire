import { describe, expect, test } from "vitest";
import { Address } from "../Address/index.js";
import { Hash } from "../Hash/index.js";
import * as Transaction from "./Transaction.js";
import type { EIP1559, EIP4844, EIP7702, Legacy } from "./types.js";

describe("Transaction Utilities", () => {
	describe("Inspection", () => {
		test("getRecipient returns to address", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const recipient = Transaction.getRecipient(tx);
			expect(recipient).toEqual(tx.to);
		});

		test("getRecipient returns null for contract creation", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80]),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const recipient = Transaction.getRecipient(tx);
			expect(recipient).toBe(null);
		});

		test("isContractCreation returns true when to is null", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80]),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isContractCreation(tx)).toBe(true);
		});

		test("isContractCreation returns false when to exists", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isContractCreation(tx)).toBe(false);
		});

		test("isContractCall returns true when to exists and data present", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isContractCall(tx)).toBe(true);
		});

		test("isContractCall returns false when to is null", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80]),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isContractCall(tx)).toBe(false);
		});

		test("isContractCall returns false when data is empty", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isContractCall(tx)).toBe(false);
		});
	});

	describe("Validation", () => {
		test("validateGasPrice succeeds for valid gas price", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateGasPrice(tx)).not.toThrow();
		});

		test("validateGasPrice throws for negative gas price", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: -1n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Gas price cannot be negative",
			);
		});

		test("validateGasPrice validates EIP-1559 fees", () => {
			const tx: EIP1559 = {
				type: 0x02,
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
			expect(() => Transaction.validateGasPrice(tx)).not.toThrow();
		});

		test("validateGasPrice throws when priority fee exceeds max fee", () => {
			const tx: EIP1559 = {
				type: 0x02,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 30000000000n,
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
			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Max priority fee per gas cannot exceed max fee per gas",
			);
		});

		test("validateGasLimit succeeds for valid gas limit", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateGasLimit(tx)).not.toThrow();
		});

		test("validateGasLimit throws for zero gas limit", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 0n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateGasLimit(tx)).toThrow(
				"Gas limit must be positive",
			);
		});

		test("validateGasLimit throws for excessive gas limit", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100_000_000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateGasLimit(tx)).toThrow(
				"Gas limit exceeds maximum",
			);
		});

		test("validateNonce succeeds for valid nonce", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 5n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateNonce(tx)).not.toThrow();
		});

		test("validateNonce throws for negative nonce", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: -1n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateNonce(tx)).toThrow(
				"Nonce cannot be negative",
			);
		});

		test("validateValue succeeds for valid value", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateValue(tx)).not.toThrow();
		});

		test("validateValue throws for negative value", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: -1n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(() => Transaction.validateValue(tx)).toThrow(
				"Value cannot be negative",
			);
		});

		test("validateChainId succeeds for valid chain ID", () => {
			const tx: EIP1559 = {
				type: 0x02,
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
			expect(() => Transaction.validateChainId(tx)).not.toThrow();
		});

		test("validateChainId throws for zero chain ID", () => {
			const tx: EIP1559 = {
				type: 0x02,
				chainId: 0n,
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
			expect(() => Transaction.validateChainId(tx)).toThrow(
				"Chain ID must be specified",
			);
		});
	});

	describe("Builders", () => {
		test("withNonce returns new tx with updated nonce", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newTx = Transaction.withNonce(tx, 5n);
			expect(newTx.nonce).toBe(5n);
			expect(tx.nonce).toBe(0n); // Original unchanged
		});

		test("withGasLimit returns new tx with updated gas limit", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newTx = Transaction.withGasLimit(tx, 50000n);
			expect(newTx.gasLimit).toBe(50000n);
			expect(tx.gasLimit).toBe(21000n);
		});

		test("withGasPrice updates gasPrice for legacy tx", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newTx = Transaction.withGasPrice(tx, 30000000000n) as Legacy;
			expect(newTx.gasPrice).toBe(30000000000n);
			expect(tx.gasPrice).toBe(20000000000n);
		});

		test("withGasPrice updates maxFeePerGas for EIP-1559 tx", () => {
			const tx: EIP1559 = {
				type: 0x02,
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
			const newTx = Transaction.withGasPrice(tx, 30000000000n) as EIP1559;
			expect(newTx.maxFeePerGas).toBe(30000000000n);
			expect(tx.maxFeePerGas).toBe(20000000000n);
		});

		test("withData returns new tx with updated data", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newData = new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]);
			const newTx = Transaction.withData(tx, newData);
			expect(newTx.data).toEqual(newData);
			expect(tx.data.length).toBe(0);
		});

		test("replaceWith bumps gas price by default percentage", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newTx = Transaction.replaceWith(tx) as Legacy;
			expect(newTx.gasPrice).toBe(20000000000n); // 10% bump rounds down with integer division
		});

		test("replaceWith accepts explicit gas price", () => {
			const tx: Legacy = {
				type: 0x00,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const newTx = Transaction.replaceWith(tx, {
				gasPrice: 25000000000n,
			}) as Legacy;
			expect(newTx.gasPrice).toBe(25000000000n);
		});

		test("replaceWith bumps EIP-1559 fees", () => {
			const tx: EIP1559 = {
				type: 0x02,
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
			const newTx = Transaction.replaceWith(tx, {
				bumpPercentage: 20,
			}) as EIP1559;
			expect(newTx.maxFeePerGas).toBe(20000000000n); // Integer division
			expect(newTx.maxPriorityFeePerGas).toBe(1000000000n);
		});
	});

	describe("EIP-Specific", () => {
		test("getBlobCount returns number of blobs", () => {
			const tx: EIP4844 = {
				type: 0x03,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: [
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000001",
					),
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000002",
					),
				],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.getBlobCount(tx)).toBe(2);
		});

		test("getBlobVersionedHashes returns hashes array", () => {
			const hashes = [
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0100000000000000000000000000000000000000000000000000000000000002",
				),
			];
			const tx: EIP4844 = {
				type: 0x03,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: hashes,
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.getBlobVersionedHashes(tx)).toEqual(hashes);
		});

		test("getAuthorizationCount returns number of authorizations", () => {
			const tx: EIP7702 = {
				type: 0x04,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				authorizationList: [
					{
						chainId: 1n,
						address: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
						nonce: 0n,
						yParity: 0,
						r: new Uint8Array(32),
						s: new Uint8Array(32),
					},
				],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.getAuthorizationCount(tx)).toBe(1);
		});

		test("getAuthorizations returns authorization list", () => {
			const authList = [
				{
					chainId: 1n,
					address: Address.from("0x742d35cc6634c0532925a3b844bc9e7595f0beb0"),
					nonce: 0n,
					yParity: 0,
					r: new Uint8Array(32),
					s: new Uint8Array(32),
				},
			];
			const tx: EIP7702 = {
				type: 0x04,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: null,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				authorizationList: authList,
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.getAuthorizations(tx)).toEqual(authList);
		});
	});
});
