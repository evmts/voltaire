/**
 * Shared test data for transaction benchmarks
 *
 * Contains realistic sample transactions with signatures for all transaction types
 */

// Legacy Transaction (Type 0)
export const legacyTransaction = {
	nonce: 42n,
	gasPrice: 20000000000n, // 20 gwei
	gasLimit: 21000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1000000000000000000n, // 1 ETH
	data: "0x",
	// EIP-155 signature (v = chainId * 2 + 35 + {0,1})
	v: 37n, // chainId 1
	r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
	s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
};

// EIP-1559 Transaction (Type 2)
export const eip1559Transaction = {
	type: "eip1559" as const,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n, // 2 gwei
	maxFeePerGas: 50000000000n, // 50 gwei
	gasLimit: 21000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1000000000000000000n, // 1 ETH
	data: "0x",
	accessList: [],
	v: 1n,
	r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
	s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
};

// EIP-1559 Transaction with Access List
export const eip1559TransactionWithAccessList = {
	type: "eip1559" as const,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gasLimit: 100000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 0n,
	data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000000de0b6b3a7640000",
	accessList: [
		{
			address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
			storageKeys: [
				"0x0000000000000000000000000000000000000000000000000000000000000001",
				"0x0000000000000000000000000000000000000000000000000000000000000002",
			],
		},
	],
	v: 1n,
	r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
	s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
};

// EIP-7702 Transaction (Type 4)
export const eip7702Transaction = {
	type: "eip7702" as const,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gasLimit: 100000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 0n,
	data: "0x",
	accessList: [],
	authorizationList: [
		{
			chainId: 1n,
			address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
			nonce: 0n,
			v: 1n,
			r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
			s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
		},
	],
	v: 1n,
	r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
	s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
};

// Serialized transactions for parsing benchmarks
export const serializedLegacyTx =
	"0xf86d2a8504a817c800825208940742d35cc6634c0532925a3b844bc9e7595f0beb880de0b6b3a764000080259a9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9ea07d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6";

export const serializedEip1559Tx =
	"0x02f8700182002a847735940084ba43b740825208940742d35cc6634c0532925a3b844bc9e7595f0beb880de0b6b3a764000080c001a09a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9ea07d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6";

export const serializedEip7702Tx =
	"0x04f8b40182002a847735940084ba43b7408301869f940742d35cc6634c0532925a3b844bc9e7595f0beb8080c0f83df83b0194742d35cc6634c0532925a3b844bc9e7595f0beb0001a09a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9ea07d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c601a09a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9ea07d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6";
