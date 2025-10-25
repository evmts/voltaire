import { describe, test, expect } from "bun:test";
import {
	type LegacyTransaction,
	type Eip1559Transaction,
	type Eip7702Transaction,
	type AccessList,
	type Authorization,
	encodeLegacyForSigning,
	serializeLegacy,
	encodeEip1559ForSigning,
	serializeEip1559,
	encodeEip7702ForSigning,
	serializeEip7702,
	parseTransaction,
	validateTransaction,
	hashTransaction,
	detectTransactionType,
} from "./transaction";

describe("Legacy Transaction", () => {
	test("should encode legacy transaction for signing (unsigned)", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n, // 20 gwei
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n, // 0.001 ETH
			data: "0x",
			v: 0n,
			r: "0x0000000000000000000000000000000000000000000000000000000000000000",
			s: "0x0000000000000000000000000000000000000000000000000000000000000000",
		};

		const encoded = encodeLegacyForSigning(tx, 1n);
		expect(encoded).toMatch(/^0x[0-9a-f]+$/);
		expect(encoded.length).toBeGreaterThan(2); // More than just "0x"
	});

	test("should encode legacy transaction for signing (signed)", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			v: 37n, // EIP-155 for mainnet
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeLegacyForSigning(tx, 1n);
		expect(encoded).toMatch(/^0x[0-9a-f]+$/);
	});

	test("should serialize legacy transaction", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const serialized = serializeLegacy(tx);
		expect(serialized).toMatch(/^0x[0-9a-f]+$/);
	});

	test("should handle contract creation (null to)", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 100000n,
			to: undefined,
			value: 0n,
			data: "0x608060405234801561001057600080fd5b50",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeLegacyForSigning(tx, 1n);
		expect(encoded).toMatch(/^0x[0-9a-f]+$/);
	});

	test("should handle transaction with data", () => {
		const tx: LegacyTransaction = {
			nonce: 5n,
			gasPrice: 30000000000n,
			gasLimit: 50000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c80000000000000000000000000000000000000000000000000de0b6b3a7640000",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeLegacyForSigning(tx, 1n);
		expect(encoded).toMatch(/^0x[0-9a-f]+$/);
	});
});

describe("EIP-1559 Transaction", () => {
	test("should encode eip1559 transaction for signing (unsigned)", () => {
		const tx: Eip1559Transaction = {
			type: "eip1559",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n, // 1 gwei
			maxFeePerGas: 20000000000n, // 20 gwei
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			accessList: [],
			v: 0n,
			r: "0x0000000000000000000000000000000000000000000000000000000000000000",
			s: "0x0000000000000000000000000000000000000000000000000000000000000000",
		};

		const encoded = encodeEip1559ForSigning(tx);
		expect(encoded).toMatch(/^0x02[0-9a-f]+$/); // Should start with 0x02
	});

	test("should encode eip1559 transaction with access list", () => {
		const accessList: AccessList = [
			{
				address: "0x0000000000000000000000000000000000000000",
				storageKeys: [
					"0x0000000000000000000000000000000000000000000000000000000000000000",
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				],
			},
		];

		const tx: Eip1559Transaction = {
			type: "eip1559",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 30000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList,
			v: 0n,
			r: "0x0000000000000000000000000000000000000000000000000000000000000000",
			s: "0x0000000000000000000000000000000000000000000000000000000000000000",
		};

		const encoded = encodeEip1559ForSigning(tx);
		expect(encoded).toMatch(/^0x02[0-9a-f]+$/);
		expect(encoded.length).toBeGreaterThan(100); // Should be larger with access list
	});

	test("should serialize eip1559 transaction", () => {
		const tx: Eip1559Transaction = {
			type: "eip1559",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			accessList: [],
			v: 1n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const serialized = serializeEip1559(tx);
		expect(serialized).toMatch(/^0x02[0-9a-f]+$/);
	});

	test("should handle multiple access list items", () => {
		const accessList: AccessList = [
			{
				address: "0x1111111111111111111111111111111111111111",
				storageKeys: [
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				],
			},
			{
				address: "0x2222222222222222222222222222222222222222",
				storageKeys: [
					"0x0000000000000000000000000000000000000000000000000000000000000001",
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				],
			},
		];

		const tx: Eip1559Transaction = {
			type: "eip1559",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 40000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList,
			v: 1n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeEip1559ForSigning(tx);
		expect(encoded).toMatch(/^0x02[0-9a-f]+$/);
	});

	test("should handle real mainnet eip1559 transaction", () => {
		// Real mainnet tx: 0x1234... (simplified)
		const tx: Eip1559Transaction = {
			type: "eip1559",
			chainId: 1n,
			nonce: 42n,
			maxPriorityFeePerGas: 2000000000n,
			maxFeePerGas: 100000000000n,
			gasLimit: 21000n,
			to: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
			value: 1000000000000000000n, // 1 ETH
			data: "0x",
			accessList: [],
			v: 1n,
			r: "0xc7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5",
			s: "0x6d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d",
		};

		const serialized = serializeEip1559(tx);
		expect(serialized).toMatch(/^0x02[0-9a-f]+$/);
	});
});

describe("EIP-7702 Transaction", () => {
	test("should encode eip7702 transaction for signing", () => {
		const authorization: Authorization = {
			chainId: 1n,
			address: "0x1111111111111111111111111111111111111111",
			nonce: 0n,
			v: 27n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const tx: Eip7702Transaction = {
			type: "eip7702",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 50000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList: [],
			authorizationList: [authorization],
			v: 0n,
			r: "0x0000000000000000000000000000000000000000000000000000000000000000",
			s: "0x0000000000000000000000000000000000000000000000000000000000000000",
		};

		const encoded = encodeEip7702ForSigning(tx);
		expect(encoded).toMatch(/^0x04[0-9a-f]+$/); // Should start with 0x04
	});

	test("should serialize eip7702 transaction", () => {
		const authorization: Authorization = {
			chainId: 1n,
			address: "0x1111111111111111111111111111111111111111",
			nonce: 0n,
			v: 27n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const tx: Eip7702Transaction = {
			type: "eip7702",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 50000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList: [],
			authorizationList: [authorization],
			v: 1n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const serialized = serializeEip7702(tx);
		expect(serialized).toMatch(/^0x04[0-9a-f]+$/);
	});

	test("should handle multiple authorizations", () => {
		const authorizationList: Authorization[] = [
			{
				chainId: 1n,
				address: "0x1111111111111111111111111111111111111111",
				nonce: 0n,
				v: 27n,
				r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
			},
			{
				chainId: 1n,
				address: "0x2222222222222222222222222222222222222222",
				nonce: 1n,
				v: 28n,
				r: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
				s: "0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba",
			},
		];

		const tx: Eip7702Transaction = {
			type: "eip7702",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 70000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList: [],
			authorizationList,
			v: 1n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeEip7702ForSigning(tx);
		expect(encoded).toMatch(/^0x04[0-9a-f]+$/);
	});

	test("should handle eip7702 with both access list and authorization list", () => {
		const accessList: AccessList = [
			{
				address: "0x3333333333333333333333333333333333333333",
				storageKeys: [
					"0x0000000000000000000000000000000000000000000000000000000000000000",
				],
			},
		];

		const authorizationList: Authorization[] = [
			{
				chainId: 1n,
				address: "0x1111111111111111111111111111111111111111",
				nonce: 0n,
				v: 27n,
				r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
			},
		];

		const tx: Eip7702Transaction = {
			type: "eip7702",
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1000000000n,
			maxFeePerGas: 20000000000n,
			gasLimit: 60000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 0n,
			data: "0x",
			accessList,
			authorizationList,
			v: 1n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const encoded = encodeEip7702ForSigning(tx);
		expect(encoded).toMatch(/^0x04[0-9a-f]+$/);
	});
});

describe("Transaction Utilities", () => {
	test("should detect legacy transaction type", () => {
		const legacyData =
			"0xf86d80851043fd8200825208940000000000000000000000000000000000000000880de0b6b3a764000080820a96a0c7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5a06d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d";
		expect(detectTransactionType(legacyData)).toBe("legacy");
	});

	test("should detect eip1559 transaction type", () => {
		const eip1559Data =
			"0x02f86d0180851043fd8200825208940000000000000000000000000000000000000000880de0b6b3a764000080c001a0c7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5a06d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d";
		expect(detectTransactionType(eip1559Data)).toBe("eip1559");
	});

	test("should detect eip7702 transaction type", () => {
		const eip7702Data =
			"0x04f86d0180851043fd8200825208940000000000000000000000000000000000000000880de0b6b3a764000080c0c001a0c7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5a06d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d";
		expect(detectTransactionType(eip7702Data)).toBe("eip7702");
	});

	test("should parse legacy transaction", () => {
		const legacyData =
			"0xf86d80851043fd8200825208940000000000000000000000000000000000000000880de0b6b3a764000080820a96a0c7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5a06d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d";
		const tx = parseTransaction(legacyData);
		expect(tx).toBeDefined();
		expect((tx as LegacyTransaction).gasPrice).toBeDefined();
	});

	test("should parse eip1559 transaction", () => {
		const eip1559Data =
			"0x02f86d0180851043fd8200825208940000000000000000000000000000000000000000880de0b6b3a764000080c001a0c7cf543e1b26a19fca825d164a0dc96e62c6a4a373d90abcf82b0de7f97e58f5a06d4b6bc588356822e38a0bec5fb4baa8efd8f19ec90b0584df2bbba09cd78c0d";
		const tx = parseTransaction(eip1559Data);
		expect(tx).toBeDefined();
		expect((tx as Eip1559Transaction).maxFeePerGas).toBeDefined();
	});

	test("should validate valid legacy transaction", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		expect(validateTransaction(tx)).toBe(true);
	});

	test("should invalidate transaction with invalid address", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0xinvalid",
			value: 1000000000000000n,
			data: "0x",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		expect(validateTransaction(tx)).toBe(false);
	});

	test("should compute transaction hash", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const hash = hashTransaction(tx);
		expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
	});

	test("should produce deterministic hash", () => {
		const tx: LegacyTransaction = {
			nonce: 0n,
			gasPrice: 20000000000n,
			gasLimit: 21000n,
			to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			value: 1000000000000000n,
			data: "0x",
			v: 37n,
			r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
		};

		const hash1 = hashTransaction(tx);
		const hash2 = hashTransaction(tx);
		expect(hash1).toBe(hash2);
	});
});
