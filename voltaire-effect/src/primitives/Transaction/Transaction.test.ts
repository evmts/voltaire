import { Address } from "@tevm/voltaire";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as VoltaireTransaction from "@tevm/voltaire/Transaction";
import * as S from "effect/Schema";
import { describe, expect, it } from "@effect/vitest";
import * as Transaction from "./index.js";

function createAddress(byte: number): AddressType {
	const addr = new Uint8Array(20);
	addr.fill(byte);
	return addr as AddressType;
}

function createHash(byte: number): HashType {
	const hash = new Uint8Array(32);
	hash.fill(byte);
	return hash as HashType;
}

function createBytes(length: number, fill = 0): Uint8Array {
	const bytes = new Uint8Array(length);
	bytes.fill(fill);
	return bytes;
}

const testAddress = createAddress(0x42);
const testSignature = {
	r: createBytes(32, 1),
	s: createBytes(32, 2),
};

describe("Transaction.Serialized", () => {
	describe("Legacy transactions", () => {
		const legacyTx: Transaction.Legacy = {
			type: Transaction.Type.Legacy,
			nonce: 5n,
			gasPrice: 25000000000n,
			gasLimit: 50000n,
			to: testAddress,
			value: 100n,
			data: new Uint8Array([1, 2, 3]),
			v: 27n,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("serializes and deserializes legacy transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(legacyTx);
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBeGreaterThan(0);

			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.type).toBe(Transaction.Type.Legacy);
			expect(decoded.nonce).toBe(legacyTx.nonce);
			expect(decoded.gasPrice).toBe(legacyTx.gasPrice);
			expect(decoded.gasLimit).toBe(legacyTx.gasLimit);
			expect(decoded.value).toBe(legacyTx.value);
		});

		it("handles contract creation (to: null)", () => {
			const contractTx: Transaction.Legacy = {
				...legacyTx,
				to: null,
				data: new Uint8Array([0x60, 0x80, 0x60, 0x40]),
			};
			const bytes = S.encodeSync(Transaction.Serialized)(contractTx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.to).toBeNull();
		});

		it("round-trips empty data", () => {
			const tx: Transaction.Legacy = { ...legacyTx, data: new Uint8Array() };
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.data.length).toBe(0);
		});
	});

	describe("EIP-2930 transactions", () => {
		const eip2930Tx: Transaction.EIP2930 = {
			type: Transaction.Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [
				{
					address: testAddress,
					storageKeys: [createHash(0x11)],
				},
			],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("serializes and deserializes EIP-2930 transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(eip2930Tx);
			expect(bytes[0]).toBe(0x01);

			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.type).toBe(Transaction.Type.EIP2930);
			expect((decoded as Transaction.EIP2930).chainId).toBe(1n);
			expect((decoded as Transaction.EIP2930).accessList.length).toBe(1);
		});

		it("handles empty access list", () => {
			const tx: Transaction.EIP2930 = { ...eip2930Tx, accessList: [] };
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP2930;
			expect(decoded.accessList.length).toBe(0);
		});

		it("handles multiple storage keys", () => {
			const tx: Transaction.EIP2930 = {
				...eip2930Tx,
				accessList: [
					{
						address: testAddress,
						storageKeys: [createHash(1), createHash(2), createHash(3)],
					},
				],
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP2930;
			expect(decoded.accessList[0]?.storageKeys.length).toBe(3);
		});
	});

	describe("EIP-1559 transactions", () => {
		const eip1559Tx: Transaction.EIP1559 = {
			type: Transaction.Type.EIP1559,
			chainId: 1n,
			nonce: 42n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array([0xab, 0xcd]),
			accessList: [],
			yParity: 1,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("serializes and deserializes EIP-1559 transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(eip1559Tx);
			expect(bytes[0]).toBe(0x02);

			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.type).toBe(Transaction.Type.EIP1559);
			expect((decoded as Transaction.EIP1559).maxFeePerGas).toBe(30000000000n);
			expect((decoded as Transaction.EIP1559).maxPriorityFeePerGas).toBe(2000000000n);
		});

		it("round-trips high gas values", () => {
			const tx: Transaction.EIP1559 = {
				...eip1559Tx,
				maxFeePerGas: 1000000000000000000n,
				maxPriorityFeePerGas: 100000000000000000n,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP1559;
			expect(decoded.maxFeePerGas).toBe(tx.maxFeePerGas);
			expect(decoded.maxPriorityFeePerGas).toBe(tx.maxPriorityFeePerGas);
		});

		it("handles different chain IDs", () => {
			for (const chainId of [1n, 137n, 42161n, 10n, 56n]) {
				const tx: Transaction.EIP1559 = { ...eip1559Tx, chainId };
				const bytes = S.encodeSync(Transaction.Serialized)(tx);
				const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP1559;
				expect(decoded.chainId).toBe(chainId);
			}
		});
	});

	describe("EIP-4844 transactions", () => {
		const blobHash = new Uint8Array(32);
		blobHash[0] = 0x01;
		
		const eip4844Tx: Transaction.EIP4844 = {
			type: Transaction.Type.EIP4844,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			maxFeePerBlobGas: 1000000000n,
			blobVersionedHashes: [blobHash as HashType],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("serializes and deserializes EIP-4844 transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(eip4844Tx);
			expect(bytes[0]).toBe(0x03);

			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.type).toBe(Transaction.Type.EIP4844);
			expect((decoded as Transaction.EIP4844).maxFeePerBlobGas).toBe(1000000000n);
		});

		it("handles multiple blob versioned hashes", () => {
			const createBlobHash = (index: number): HashType => {
				const hash = new Uint8Array(32);
				hash[0] = 0x01;
				hash[31] = index;
				return hash as HashType;
			};
			const tx: Transaction.EIP4844 = {
				...eip4844Tx,
				blobVersionedHashes: [createBlobHash(1), createBlobHash(2), createBlobHash(3), createBlobHash(4)],
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP4844;
			expect(decoded.blobVersionedHashes.length).toBe(4);
		});
	});

	describe("EIP-7702 transactions", () => {
		const eip7702Tx: Transaction.EIP7702 = {
			type: Transaction.Type.EIP7702,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			authorizationList: [
				{
					chainId: 1n,
					address: testAddress,
					nonce: 0n,
					yParity: 0,
					r: testSignature.r,
					s: testSignature.s,
				},
			],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("serializes and deserializes EIP-7702 transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(eip7702Tx);
			expect(bytes[0]).toBe(0x04);

			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.type).toBe(Transaction.Type.EIP7702);
			expect((decoded as Transaction.EIP7702).authorizationList.length).toBe(1);
		});

		it("handles empty authorization list", () => {
			const tx: Transaction.EIP7702 = { ...eip7702Tx, authorizationList: [] };
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP7702;
			expect(decoded.authorizationList.length).toBe(0);
		});

		it("handles multiple authorizations", () => {
			const auth = {
				chainId: 1n,
				address: testAddress,
				nonce: 0n,
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const tx: Transaction.EIP7702 = {
				...eip7702Tx,
				authorizationList: [auth, { ...auth, nonce: 1n }, { ...auth, nonce: 2n }],
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(bytes) as Transaction.EIP7702;
			expect(decoded.authorizationList.length).toBe(3);
		});
	});

	describe("error handling", () => {
		it("rejects invalid bytes", () => {
			expect(() => S.decodeSync(Transaction.Serialized)(new Uint8Array([0xff]))).toThrow();
		});

		it("rejects empty bytes", () => {
			expect(() => S.decodeSync(Transaction.Serialized)(new Uint8Array())).toThrow();
		});

		it("rejects truncated transaction", () => {
			const tx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const truncated = bytes.slice(0, bytes.length - 10);
			expect(() => S.decodeSync(Transaction.Serialized)(truncated)).toThrow();
		});
	});
});

describe("Transaction.Rpc", () => {
	it("parses EIP-1559 RPC format", () => {
		const rpc = {
			type: "0x2",
			chainId: "0x1",
			nonce: "0x0",
			maxPriorityFeePerGas: "0x3b9aca00",
			maxFeePerGas: "0x6fc23ac00",
			gasLimit: "0x5208",
			to: "0x" + "42".repeat(20),
			value: "0xde0b6b3a7640000",
			data: "0x",
			accessList: [],
		};
		const tx = S.decodeSync(Transaction.Rpc)(rpc);
		expect(tx.type).toBe(Transaction.Type.EIP1559);
		expect((tx as Transaction.EIP1559).chainId).toBe(1n);
		expect(tx.nonce).toBe(0n);
	});

	it("parses legacy RPC format", () => {
		const rpc = {
			type: "0x0",
			nonce: "0x5",
			gasPrice: "0x5d21dba00",
			gas: "0xc350",
			to: "0x" + "42".repeat(20),
			value: "0x64",
			data: "0x010203",
		};
		const tx = S.decodeSync(Transaction.Rpc)(rpc);
		expect(tx.type).toBe(Transaction.Type.Legacy);
		expect(tx.nonce).toBe(5n);
	});

	it("round-trips EIP-1559 through RPC format", () => {
		const eip1559Tx: Transaction.EIP1559 = {
			type: Transaction.Type.EIP1559,
			chainId: 1n,
			nonce: 10n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 30000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 1000000000000000000n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};
		const rpc = S.encodeSync(Transaction.Rpc)(eip1559Tx);
		expect(rpc.type).toBe("0x2");
		expect(rpc.chainId).toBe("0x1");
		expect(rpc.nonce).toBe("0xa");
	});
});

describe("Transaction pure functions", () => {
	const eip1559Tx: Transaction.EIP1559 = {
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 0n,
		maxPriorityFeePerGas: 2000000000n,
		maxFeePerGas: 30000000000n,
		gasLimit: 21000n,
		to: testAddress,
		value: 1000000000000000000n,
		data: new Uint8Array(),
		accessList: [],
		yParity: 1,
		r: testSignature.r,
		s: testSignature.s,
	};

	describe("hash", () => {
		it("returns 32-byte hash", () => {
			const h = Transaction.hash(eip1559Tx);
			expect(h.length).toBe(32);
		});

		it("produces same hash for same transaction", () => {
			const h1 = Transaction.hash(eip1559Tx);
			const h2 = Transaction.hash(eip1559Tx);
			expect(h1).toEqual(h2);
		});

		it("produces different hash for different transactions", () => {
			const h1 = Transaction.hash(eip1559Tx);
			const h2 = Transaction.hash({ ...eip1559Tx, nonce: 1n });
			expect(h1).not.toEqual(h2);
		});
	});

	describe("signingHash", () => {
		it("returns 32-byte signing hash", () => {
			const h = Transaction.signingHash(eip1559Tx);
			expect(h.length).toBe(32);
		});

		it("differs from transaction hash", () => {
			const txHash = Transaction.hash(eip1559Tx);
			const signHash = Transaction.signingHash(eip1559Tx);
			expect(txHash).not.toEqual(signHash);
		});
	});

	describe("getChainId", () => {
		it("returns chain ID for EIP-1559", () => {
			expect(Transaction.getChainId(eip1559Tx)).toBe(1n);
		});

		it("returns chain ID for legacy with EIP-155", () => {
			const legacyTx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 37n,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.getChainId(legacyTx)).toBe(1n);
		});
	});

	describe("getGasPrice", () => {
		it("returns gas price for legacy", () => {
			const legacyTx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 25000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.getGasPrice(legacyTx)).toBe(25000000000n);
		});

		it("returns effective gas price for EIP-1559 with base fee", () => {
			const baseFee = 10000000000n;
			const effectivePrice = Transaction.getGasPrice(eip1559Tx, baseFee);
			expect(effectivePrice).toBe(baseFee + eip1559Tx.maxPriorityFeePerGas);
		});
	});

	describe("isContractCreation", () => {
		it("returns true for null to", () => {
			const legacyTx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 1000000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80]),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.isContractCreation(legacyTx)).toBe(true);
		});

		it("returns false for non-null to", () => {
			expect(Transaction.isContractCreation(eip1559Tx)).toBe(false);
		});
	});

	describe("isSigned", () => {
		it("returns true for signed transaction", () => {
			expect(Transaction.isSigned(eip1559Tx)).toBe(true);
		});

		it("returns false for unsigned transaction", () => {
			const unsignedTx: Transaction.EIP1559 = {
				...eip1559Tx,
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isSigned(unsignedTx)).toBe(false);
		});
	});

	describe("detectType", () => {
		it("detects legacy transaction", () => {
			const legacyTx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(legacyTx);
			expect(Transaction.detectType(bytes)).toBe(Transaction.Type.Legacy);
		});

		it("detects EIP-1559 transaction", () => {
			const bytes = S.encodeSync(Transaction.Serialized)(eip1559Tx);
			expect(Transaction.detectType(bytes)).toBe(Transaction.Type.EIP1559);
		});

		it("detects EIP-4844 transaction", () => {
			const blobH = new Uint8Array(32);
			blobH[0] = 0x01;
			const eip4844Tx: Transaction.EIP4844 = {
				type: Transaction.Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: [blobH as HashType],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(eip4844Tx);
			expect(Transaction.detectType(bytes)).toBe(Transaction.Type.EIP4844);
		});
	});
});

describe("Transaction.Type", () => {
	it("has correct enum values", () => {
		expect(Transaction.Type.Legacy).toBe(0x00);
		expect(Transaction.Type.EIP2930).toBe(0x01);
		expect(Transaction.Type.EIP1559).toBe(0x02);
		expect(Transaction.Type.EIP4844).toBe(0x03);
		expect(Transaction.Type.EIP7702).toBe(0x04);
	});
});
