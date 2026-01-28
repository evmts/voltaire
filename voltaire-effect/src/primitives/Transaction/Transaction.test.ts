import { describe, expect, it } from "@effect/vitest";
import type { AddressType } from "@tevm/voltaire/Address";
import type { HashType } from "@tevm/voltaire/Hash";
import * as S from "effect/Schema";
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
			expect((decoded as Transaction.Legacy).gasPrice).toBe(legacyTx.gasPrice);
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
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP2930;
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
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP2930;
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
			expect((decoded as Transaction.EIP1559).maxPriorityFeePerGas).toBe(
				2000000000n,
			);
		});

		it("round-trips high gas values", () => {
			const tx: Transaction.EIP1559 = {
				...eip1559Tx,
				maxFeePerGas: 1000000000000000000n,
				maxPriorityFeePerGas: 100000000000000000n,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.maxFeePerGas).toBe(tx.maxFeePerGas);
			expect(decoded.maxPriorityFeePerGas).toBe(tx.maxPriorityFeePerGas);
		});

		it("handles different chain IDs", () => {
			for (const chainId of [1n, 137n, 42161n, 10n, 56n]) {
				const tx: Transaction.EIP1559 = { ...eip1559Tx, chainId };
				const bytes = S.encodeSync(Transaction.Serialized)(tx);
				const decoded = S.decodeSync(Transaction.Serialized)(
					bytes,
				) as Transaction.EIP1559;
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
			expect((decoded as Transaction.EIP4844).maxFeePerBlobGas).toBe(
				1000000000n,
			);
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
				blobVersionedHashes: [
					createBlobHash(1),
					createBlobHash(2),
					createBlobHash(3),
					createBlobHash(4),
				],
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP4844;
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
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP7702;
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
				authorizationList: [
					auth,
					{ ...auth, nonce: 1n },
					{ ...auth, nonce: 2n },
				],
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP7702;
			expect(decoded.authorizationList.length).toBe(3);
		});
	});

	describe("error handling", () => {
		it("rejects invalid bytes", () => {
			expect(() =>
				S.decodeSync(Transaction.Serialized)(new Uint8Array([0xff])),
			).toThrow();
		});

		it("rejects empty bytes", () => {
			expect(() =>
				S.decodeSync(Transaction.Serialized)(new Uint8Array()),
			).toThrow();
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
			to: `0x${"42".repeat(20)}`,
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
			to: `0x${"42".repeat(20)}`,
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

describe("Transaction.Schema (direct struct validation)", () => {
	// Schemas expect hex string addresses for the encoded (input) side
	const testAddressHex = `0x${"42".repeat(20)}`;

	describe("LegacySchema", () => {
		it("validates valid legacy transaction", () => {
			const tx: S.Schema.Encoded<typeof Transaction.LegacySchema> = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.LegacySchema)(tx);
			expect(decoded.type).toBe(Transaction.Type.Legacy);
		});

		it("rejects wrong type field", () => {
			const tx = {
				type: Transaction.Type.EIP1559,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(() =>
				S.decodeSync(Transaction.LegacySchema)(tx as never),
			).toThrow();
		});

		it("rejects missing required fields", () => {
			const tx = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				// missing gasPrice
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(() => S.decodeSync(Transaction.LegacySchema)(tx as any)).toThrow();
		});

		it("validates contract creation with null to", () => {
			const tx: S.Schema.Encoded<typeof Transaction.LegacySchema> = {
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
			const decoded = S.decodeSync(Transaction.LegacySchema)(tx);
			expect(decoded.to).toBeNull();
		});
	});

	describe("EIP2930Schema", () => {
		it("validates valid EIP-2930 transaction", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP2930Schema> = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.EIP2930Schema)(tx);
			expect(decoded.type).toBe(Transaction.Type.EIP2930);
			expect(decoded.chainId).toBe(1n);
		});

		it("validates with access list containing storage keys", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP2930Schema> = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [
					{
						address: testAddressHex,
						storageKeys: [createHash(1), createHash(2)],
					},
				],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.EIP2930Schema)(tx);
			expect(decoded.accessList.length).toBe(1);
			expect(decoded.accessList[0]?.storageKeys.length).toBe(2);
		});
	});

	describe("EIP1559Schema", () => {
		it("validates valid EIP-1559 transaction", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP1559Schema> = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.EIP1559Schema)(tx);
			expect(decoded.type).toBe(Transaction.Type.EIP1559);
			expect(decoded.maxFeePerGas).toBe(20000000000n);
		});

		it("rejects wrong type field", () => {
			const tx = {
				type: Transaction.Type.Legacy,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(() =>
				S.decodeSync(Transaction.EIP1559Schema)(tx as any),
			).toThrow();
		});
	});

	describe("EIP4844Schema", () => {
		const blobHash = createHash(0x01);

		it("validates valid EIP-4844 transaction", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP4844Schema> = {
				type: Transaction.Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: [blobHash],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.EIP4844Schema)(tx);
			expect(decoded.type).toBe(Transaction.Type.EIP4844);
			expect(decoded.maxFeePerBlobGas).toBe(1000000000n);
		});

		it("validates with empty blob hashes", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP4844Schema> = {
				type: Transaction.Type.EIP4844,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.EIP4844Schema)(tx);
			expect(decoded.blobVersionedHashes.length).toBe(0);
		});
	});

	describe("EIP7702Schema", () => {
		it("validates valid EIP-7702 transaction", () => {
			const tx: S.Schema.Encoded<typeof Transaction.EIP7702Schema> = {
				type: Transaction.Type.EIP7702,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				authorizationList: [
					{
						chainId: 1n,
						address: testAddressHex,
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
			const decoded = S.decodeSync(Transaction.EIP7702Schema)(tx);
			expect(decoded.type).toBe(Transaction.Type.EIP7702);
			expect(decoded.authorizationList.length).toBe(1);
		});
	});

	describe("Schema (union)", () => {
		it("accepts any valid transaction type", () => {
			const legacyTx: S.Schema.Encoded<typeof Transaction.LegacySchema> = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				v: 27n,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.Schema)(legacyTx);
			expect(decoded.type).toBe(Transaction.Type.Legacy);
		});

		it("discriminates based on type field", () => {
			const eip1559: S.Schema.Encoded<typeof Transaction.EIP1559Schema> = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddressHex,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const decoded = S.decodeSync(Transaction.Schema)(eip1559);
			expect(decoded.type).toBe(Transaction.Type.EIP1559);
		});
	});
});

describe("Transaction.Rpc additional coverage", () => {
	describe("EIP-2930 RPC", () => {
		it("parses EIP-2930 RPC format", () => {
			const rpc = {
				type: "0x1",
				chainId: "0x1",
				nonce: "0x0",
				gasPrice: "0x4a817c800",
				gasLimit: "0x5208",
				to: `0x${"42".repeat(20)}`,
				value: "0x0",
				data: "0x",
				accessList: [
					{
						address: `0x${"11".repeat(20)}`,
						storageKeys: [`0x${"22".repeat(32)}`],
					},
				],
			};
			const tx = S.decodeSync(Transaction.Rpc)(rpc);
			expect(tx.type).toBe(Transaction.Type.EIP2930);
			expect((tx as Transaction.EIP2930).accessList.length).toBe(1);
		});

		it("round-trips EIP-2930 through RPC format", () => {
			const eip2930Tx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 5n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const rpc = S.encodeSync(Transaction.Rpc)(eip2930Tx);
			expect(rpc.type).toBe("0x1");
			expect(rpc.chainId).toBe("0x1");
		});
	});

	describe("EIP-4844 RPC", () => {
		it("parses EIP-4844 RPC format", () => {
			const rpc = {
				type: "0x3",
				chainId: "0x1",
				nonce: "0x0",
				maxPriorityFeePerGas: "0x3b9aca00",
				maxFeePerGas: "0x4a817c800",
				gasLimit: "0x5208",
				to: `0x${"42".repeat(20)}`,
				value: "0x0",
				data: "0x",
				accessList: [],
				maxFeePerBlobGas: "0x3b9aca00",
				blobVersionedHashes: [`0x01${"00".repeat(31)}`],
			};
			const tx = S.decodeSync(Transaction.Rpc)(rpc);
			expect(tx.type).toBe(Transaction.Type.EIP4844);
			expect((tx as Transaction.EIP4844).maxFeePerBlobGas).toBe(1000000000n);
		});

		it("round-trips EIP-4844 through RPC format", () => {
			const blobHash = createHash(0x01);
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
				blobVersionedHashes: [blobHash],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const rpc = S.encodeSync(Transaction.Rpc)(eip4844Tx);
			expect(rpc.type).toBe("0x3");
		});
	});

	describe("EIP-7702 RPC", () => {
		it("parses EIP-7702 RPC format", () => {
			const rpc = {
				type: "0x4",
				chainId: "0x1",
				nonce: "0x0",
				maxPriorityFeePerGas: "0x3b9aca00",
				maxFeePerGas: "0x4a817c800",
				gasLimit: "0x5208",
				to: `0x${"42".repeat(20)}`,
				value: "0x0",
				data: "0x",
				accessList: [],
				authorizationList: [
					{
						chainId: "0x1",
						address: `0x${"42".repeat(20)}`,
						nonce: "0x0",
						yParity: "0x0",
						r: `0x${"11".repeat(32)}`,
						s: `0x${"22".repeat(32)}`,
					},
				],
			};
			const tx = S.decodeSync(Transaction.Rpc)(rpc);
			expect(tx.type).toBe(Transaction.Type.EIP7702);
			expect((tx as Transaction.EIP7702).authorizationList.length).toBe(1);
		});

		it("round-trips EIP-7702 through RPC format", () => {
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
			const rpc = S.encodeSync(Transaction.Rpc)(eip7702Tx);
			expect(rpc.type).toBe("0x4");
		});
	});

	describe("RPC error handling", () => {
		it("rejects invalid type prefix", () => {
			const rpc = {
				type: "0xff",
				nonce: "0x0",
				gasPrice: "0x4a817c800",
				gasLimit: "0x5208",
				to: `0x${"42".repeat(20)}`,
				value: "0x0",
				data: "0x",
			};
			expect(() => S.decodeSync(Transaction.Rpc)(rpc)).toThrow();
		});

		it("handles null to field for contract creation", () => {
			const rpc = {
				type: "0x2",
				chainId: "0x1",
				nonce: "0x0",
				maxPriorityFeePerGas: "0x3b9aca00",
				maxFeePerGas: "0x4a817c800",
				gasLimit: "0xf4240",
				to: null,
				value: "0x0",
				data: "0x608060405234801561001057600080fd5b50",
				accessList: [],
			};
			const tx = S.decodeSync(Transaction.Rpc)(rpc);
			expect(tx.to).toBeNull();
		});
	});
});

describe("Transaction edge cases", () => {
	describe("value edge cases", () => {
		it("handles zero value transaction", () => {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.value).toBe(0n);
		});

		it("handles max uint256 value", () => {
			const maxUint256 = 2n ** 256n - 1n;
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: maxUint256,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.value).toBe(maxUint256);
		});
	});

	describe("nonce edge cases", () => {
		it("handles zero nonce", () => {
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
			const decoded = S.decodeSync(Transaction.Serialized)(bytes);
			expect(decoded.nonce).toBe(0n);
		});

		it("handles large nonce", () => {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 2n ** 64n - 1n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.nonce).toBe(2n ** 64n - 1n);
		});
	});

	describe("gas limit edge cases", () => {
		it("handles minimum gas limit (21000)", () => {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.gasLimit).toBe(21000n);
		});

		it("handles high gas limit", () => {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 30000000n, // ~30M gas (block limit)
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.gasLimit).toBe(30000000n);
		});
	});

	describe("access list edge cases", () => {
		it("handles access list with multiple addresses", () => {
			const addr1 = createAddress(0x11);
			const addr2 = createAddress(0x22);
			const addr3 = createAddress(0x33);
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 100000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [
					{ address: addr1, storageKeys: [createHash(1)] },
					{ address: addr2, storageKeys: [createHash(2), createHash(3)] },
					{ address: addr3, storageKeys: [] },
				],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.accessList.length).toBe(3);
			expect(decoded.accessList[0]?.storageKeys.length).toBe(1);
			expect(decoded.accessList[1]?.storageKeys.length).toBe(2);
			expect(decoded.accessList[2]?.storageKeys.length).toBe(0);
		});
	});

	describe("data field edge cases", () => {
		it("handles large data field", () => {
			const largeData = new Uint8Array(10000);
			largeData.fill(0xab);
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 1000000n,
				to: testAddress,
				value: 0n,
				data: largeData,
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(tx);
			const decoded = S.decodeSync(Transaction.Serialized)(
				bytes,
			) as Transaction.EIP1559;
			expect(decoded.data.length).toBe(10000);
			expect(decoded.data[0]).toBe(0xab);
		});
	});
});

describe("Transaction pure functions additional coverage", () => {
	const eip1559Tx: Transaction.EIP1559 = {
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 42n,
		maxPriorityFeePerGas: 2000000000n,
		maxFeePerGas: 30000000000n,
		gasLimit: 100000n,
		to: testAddress,
		value: 1000000000000000000n,
		data: new Uint8Array([0xab, 0xcd, 0xef]),
		accessList: [],
		yParity: 1,
		r: testSignature.r,
		s: testSignature.s,
	};

	describe("getNonce", () => {
		it("returns nonce from transaction", () => {
			expect(Transaction.getNonce(eip1559Tx)).toBe(42n);
		});
	});

	describe("getGasLimit", () => {
		it("returns gas limit from transaction", () => {
			expect(Transaction.getGasLimit(eip1559Tx)).toBe(100000n);
		});
	});

	describe("getValue", () => {
		it("returns value from transaction", () => {
			expect(Transaction.getValue(eip1559Tx)).toBe(1000000000000000000n);
		});
	});

	describe("getData", () => {
		it("returns data from transaction", () => {
			const data = Transaction.getData(eip1559Tx);
			expect(data.length).toBe(3);
			expect(data[0]).toBe(0xab);
		});
	});

	describe("getRecipient", () => {
		it("returns recipient address", () => {
			const recipient = Transaction.getRecipient(eip1559Tx);
			expect(recipient).toEqual(testAddress);
		});

		it("returns null for contract creation", () => {
			const contractTx: Transaction.EIP1559 = {
				...eip1559Tx,
				to: null,
			};
			const recipient = Transaction.getRecipient(contractTx);
			expect(recipient).toBeNull();
		});
	});

	describe("getChainId additional cases", () => {
		it("returns chain ID for EIP-2930", () => {
			const eip2930Tx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 137n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.getChainId(eip2930Tx)).toBe(137n);
		});

		it("returns chain ID for EIP-4844", () => {
			const blobHash = createHash(0x01);
			const eip4844Tx: Transaction.EIP4844 = {
				type: Transaction.Type.EIP4844,
				chainId: 42161n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				maxFeePerBlobGas: 1000000000n,
				blobVersionedHashes: [blobHash],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.getChainId(eip4844Tx)).toBe(42161n);
		});

		it("returns null for pre-EIP-155 legacy", () => {
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
			expect(Transaction.getChainId(legacyTx)).toBeNull();
		});
	});

	describe("getGasPrice additional cases", () => {
		it("returns baseFee when base fee exceeds maxFee", () => {
			const baseFee = 50000000000n; // Higher than maxFeePerGas (30000000000n)
			const effectivePrice = Transaction.getGasPrice(eip1559Tx, baseFee);
			// When baseFee > maxFee, effectivePriorityFee clamps to 0, returns baseFee
			expect(effectivePrice).toBe(baseFee);
		});

		it("returns gas price for EIP-2930", () => {
			const eip2930Tx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 25000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.getGasPrice(eip2930Tx)).toBe(25000000000n);
		});
	});

	describe("detectType additional cases", () => {
		it("detects EIP-2930 transaction", () => {
			const eip2930Tx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(eip2930Tx);
			expect(Transaction.detectType(bytes)).toBe(Transaction.Type.EIP2930);
		});

		it("detects EIP-7702 transaction", () => {
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
				authorizationList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const bytes = S.encodeSync(Transaction.Serialized)(eip7702Tx);
			expect(Transaction.detectType(bytes)).toBe(Transaction.Type.EIP7702);
		});
	});

	describe("isSigned additional cases", () => {
		it("returns true for legacy with valid signature", () => {
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
			expect(Transaction.isSigned(legacyTx)).toBe(true);
		});

		it("returns false for legacy with zero signature", () => {
			const legacyTx: Transaction.Legacy = {
				type: Transaction.Type.Legacy,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				v: 0n,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			expect(Transaction.isSigned(legacyTx)).toBe(false);
		});
	});

	describe("isContractCreation additional cases", () => {
		it("returns true for EIP-1559 contract creation", () => {
			const contractTx: Transaction.EIP1559 = {
				...eip1559Tx,
				to: null,
				data: new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]),
			};
			expect(Transaction.isContractCreation(contractTx)).toBe(true);
		});

		it("returns true for EIP-2930 contract creation", () => {
			const contractTx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 1000000n,
				to: null,
				value: 0n,
				data: new Uint8Array([0x60, 0x80]),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			expect(Transaction.isContractCreation(contractTx)).toBe(true);
		});
	});

	describe("hash consistency", () => {
		it("produces consistent hashes across transaction types", () => {
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
			const h1 = Transaction.hash(legacyTx);
			const h2 = Transaction.hash(legacyTx);
			expect(h1).toEqual(h2);

			const eip2930Tx: Transaction.EIP2930 = {
				type: Transaction.Type.EIP2930,
				chainId: 1n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			const h3 = Transaction.hash(eip2930Tx);
			const h4 = Transaction.hash(eip2930Tx);
			expect(h3).toEqual(h4);
		});
	});
});

describe("Transaction type guards", () => {
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

	const eip1559Tx: Transaction.EIP1559 = {
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 0n,
		maxPriorityFeePerGas: 1000000000n,
		maxFeePerGas: 20000000000n,
		gasLimit: 21000n,
		to: testAddress,
		value: 0n,
		data: new Uint8Array(),
		accessList: [],
		yParity: 0,
		r: testSignature.r,
		s: testSignature.s,
	};

	describe("isLegacy", () => {
		it("returns true for legacy transactions", () => {
			expect(Transaction.isLegacy(legacyTx)).toBe(true);
		});

		it("returns false for non-legacy transactions", () => {
			expect(Transaction.isLegacy(eip1559Tx)).toBe(false);
		});
	});

	describe("isEIP1559", () => {
		it("returns true for EIP-1559 transactions", () => {
			expect(Transaction.isEIP1559(eip1559Tx)).toBe(true);
		});

		it("returns false for non-EIP-1559 transactions", () => {
			expect(Transaction.isEIP1559(legacyTx)).toBe(false);
		});
	});

	describe("isEIP2930", () => {
		const eip2930Tx: Transaction.EIP2930 = {
			type: Transaction.Type.EIP2930,
			chainId: 1n,
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: testAddress,
			value: 0n,
			data: new Uint8Array(),
			accessList: [],
			yParity: 0,
			r: testSignature.r,
			s: testSignature.s,
		};

		it("returns true for EIP-2930 transactions", () => {
			expect(Transaction.isEIP2930(eip2930Tx)).toBe(true);
		});

		it("returns false for non-EIP-2930 transactions", () => {
			expect(Transaction.isEIP2930(legacyTx)).toBe(false);
		});
	});
});

describe("Transaction mutation functions", () => {
	const baseTx: Transaction.EIP1559 = {
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 0n,
		maxPriorityFeePerGas: 1000000000n,
		maxFeePerGas: 20000000000n,
		gasLimit: 21000n,
		to: testAddress,
		value: 0n,
		data: new Uint8Array(),
		accessList: [],
		yParity: 0,
		r: testSignature.r,
		s: testSignature.s,
	};

	describe("withNonce", () => {
		it("returns new transaction with updated nonce", () => {
			const updated = Transaction.withNonce(baseTx, 42n);
			expect(updated.nonce).toBe(42n);
			expect(baseTx.nonce).toBe(0n);
		});
	});

	describe("withGasLimit", () => {
		it("returns new transaction with updated gas limit", () => {
			const updated = Transaction.withGasLimit(baseTx, 100000n);
			expect(updated.gasLimit).toBe(100000n);
			expect(baseTx.gasLimit).toBe(21000n);
		});
	});

	describe("withData", () => {
		it("returns new transaction with updated data", () => {
			const newData = new Uint8Array([1, 2, 3, 4]);
			const updated = Transaction.withData(baseTx, newData);
			expect(updated.data).toEqual(newData);
			expect(baseTx.data.length).toBe(0);
		});
	});

	describe("replaceWith", () => {
		it("returns new transaction with fee bump", () => {
			const replaced = Transaction.replaceWith(baseTx);
			expect((replaced as Transaction.EIP1559).maxFeePerGas).toBeGreaterThan(
				baseTx.maxFeePerGas,
			);
		});
	});
});

describe("Transaction accessors", () => {
	const eip1559Tx: Transaction.EIP1559 = {
		type: Transaction.Type.EIP1559,
		chainId: 1n,
		nonce: 5n,
		maxPriorityFeePerGas: 1000000000n,
		maxFeePerGas: 20000000000n,
		gasLimit: 21000n,
		to: testAddress,
		value: 100n,
		data: new Uint8Array([1, 2, 3]),
		accessList: [{ address: testAddress, storageKeys: [] }],
		yParity: 0,
		r: testSignature.r,
		s: testSignature.s,
	};

	describe("hasAccessList", () => {
		it("returns true for EIP-1559 transactions", () => {
			expect(Transaction.hasAccessList(eip1559Tx)).toBe(true);
		});

		it("returns false for legacy transactions", () => {
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
			expect(Transaction.hasAccessList(legacyTx)).toBe(false);
		});
	});

	describe("getAccessList", () => {
		it("returns access list for EIP-1559", () => {
			const list = Transaction.getAccessList(eip1559Tx);
			expect(list.length).toBe(1);
		});
	});

	describe("isContractCall", () => {
		it("returns true when to is set and data is non-empty", () => {
			expect(Transaction.isContractCall(eip1559Tx)).toBe(true);
		});

		it("returns false when data is empty", () => {
			const tx = { ...eip1559Tx, data: new Uint8Array() };
			expect(Transaction.isContractCall(tx)).toBe(false);
		});

		it("returns false for contract creation", () => {
			const tx = { ...eip1559Tx, to: null };
			expect(Transaction.isContractCall(tx)).toBe(false);
		});
	});

	describe("format", () => {
		it("returns string representation", () => {
			const formatted = Transaction.format(eip1559Tx);
			expect(typeof formatted).toBe("string");
			expect(formatted.length).toBeGreaterThan(0);
		});
	});
});

describe("Transaction Effect validation", () => {
	it.effect("assertSigned succeeds for signed transaction", () =>
		Effect.gen(function* () {
			const signedTx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			yield* Transaction.assertSigned(signedTx);
		}),
	);

	it.effect("assertSigned fails for unsigned transaction", () =>
		Effect.gen(function* () {
			const unsignedTx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: new Uint8Array(32),
				s: new Uint8Array(32),
			};
			const result = yield* Effect.either(Transaction.assertSigned(unsignedTx));
			expect(result._tag).toBe("Left");
		}),
	);

	it.effect("validateGasLimit succeeds for valid gas limit", () =>
		Effect.gen(function* () {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			yield* Transaction.validateGasLimit(tx);
		}),
	);

	it.effect("validateNonce succeeds for valid nonce", () =>
		Effect.gen(function* () {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 0n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			yield* Transaction.validateNonce(tx);
		}),
	);

	it.effect("validateValue succeeds for valid value", () =>
		Effect.gen(function* () {
			const tx: Transaction.EIP1559 = {
				type: Transaction.Type.EIP1559,
				chainId: 1n,
				nonce: 0n,
				maxPriorityFeePerGas: 1000000000n,
				maxFeePerGas: 20000000000n,
				gasLimit: 21000n,
				to: testAddress,
				value: 1000000000000000000n,
				data: new Uint8Array(),
				accessList: [],
				yParity: 0,
				r: testSignature.r,
				s: testSignature.s,
			};
			yield* Transaction.validateValue(tx);
		}),
	);
});

import * as Effect from "effect/Effect";
