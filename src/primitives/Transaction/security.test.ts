import { describe, expect, it } from "vitest";
import { Address } from "../Address/index.js";
import { Hash } from "../Hash/index.js";
import { Type } from "./types.js";
import type { Legacy, EIP1559, EIP4844 } from "./types.js";
import * as Transaction from "./index.js";

describe("Transaction Security Tests", () => {
	describe("Signature validation", () => {
		it("detects unsigned transaction (zero r and s)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			expect(Transaction.isSigned(tx)).toBe(false);
		});

		it("detects unsigned transaction (zero r)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32).fill(1),
			};

			expect(Transaction.isSigned(tx)).toBe(false);
		});

		it("detects unsigned transaction (zero s)", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32),
			};

			expect(Transaction.isSigned(tx)).toBe(false);
		});

		it("validates signed transaction", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(Transaction.isSigned(tx)).toBe(true);
		});

		it("assertSigned throws for unsigned transaction", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};

			expect(() => Transaction.assertSigned(tx)).toThrow(
				"Transaction is not signed",
			);
		});
	});

	describe("Gas validation", () => {
		it("validateGasLimit accepts valid gas limit", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasLimit(tx)).not.toThrow();
		});

		it("validateGasLimit rejects zero gas limit", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 0n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasLimit(tx)).toThrow(
				"Gas limit must be positive",
			);
		});

		it("validateGasLimit rejects excessive gas limit", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 100_000_000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasLimit(tx)).toThrow(
				"Gas limit exceeds maximum",
			);
		});

		it("validateGasPrice accepts valid gas price", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).not.toThrow();
		});

		it("validateGasPrice rejects negative gas price", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: -1n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Gas price cannot be negative",
			);
		});
	});

	describe("EIP-1559 fee validation", () => {
		it("validates correct fee structure", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).not.toThrow();
		});

		it("rejects priority fee exceeding max fee", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 30000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Max priority fee per gas cannot exceed max fee per gas",
			);
		});

		it("rejects negative priority fee", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: -1n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Max priority fee per gas cannot be negative",
			);
		});

		it("rejects negative max fee", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: -1n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateGasPrice(tx)).toThrow(
				"Max fee per gas cannot be negative",
			);
		});
	});

	describe("Value validation", () => {
		it("accepts valid value", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 1000000000000000000n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateValue(tx)).not.toThrow();
		});

		it("accepts zero value", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateValue(tx)).not.toThrow();
		});

		it("rejects negative value", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: -1n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateValue(tx)).toThrow(
				"Value cannot be negative",
			);
		});
	});

	describe("Nonce validation", () => {
		it("accepts valid nonce", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 5n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateNonce(tx)).not.toThrow();
		});

		it("accepts zero nonce", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateNonce(tx)).not.toThrow();
		});

		it("rejects negative nonce", () => {
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: -1n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateNonce(tx)).toThrow(
				"Nonce cannot be negative",
			);
		});
	});

	describe("Chain ID validation", () => {
		it("accepts valid chain ID", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateChainId(tx)).not.toThrow();
		});

		it("rejects zero chain ID", () => {
			const tx: EIP1559 = {
				type: Type.EIP1559,
				chainId: 0n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(() => Transaction.validateChainId(tx)).toThrow(
				"Chain ID must be specified",
			);
		});
	});

	describe("EIP-4844 specific validation", () => {
		it("validates blob transaction with valid parameters", () => {
			const tx: EIP4844 = {
				type: Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 2000000000n,
				blobVersionedHashes: [
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000001",
					),
				],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(Transaction.getBlobCount(tx)).toBe(1);
			expect(() => Transaction.validateGasPrice(tx)).not.toThrow();
		});

		it("counts multiple blobs correctly", () => {
			const tx: EIP4844 = {
				type: Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 2000000000n,
				blobVersionedHashes: [
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000001",
					),
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000002",
					),
					Hash.from(
						"0x0100000000000000000000000000000000000000000000000000000000000003",
					),
				],
				yParity: 0,
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			expect(Transaction.getBlobCount(tx)).toBe(3);
		});
	});

	describe("Overflow protection", () => {
		it("handles max uint256 values", () => {
			const maxUint256 = 2n ** 256n - 1n;
			const tx: Legacy = {
				type: Type.Legacy,
				nonce: maxUint256,
				gasPrice: maxUint256,
				gasLimit: maxUint256,
				to: Address("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEB0"),
				value: maxUint256,
				data: new Uint8Array(),
				v: maxUint256,
				r: new Uint8Array(32).fill(0xff),
				s: new Uint8Array(32).fill(0xff),
			};

			expect(tx.nonce).toBe(maxUint256);
			expect(tx.value).toBe(maxUint256);
		});
	});
});
