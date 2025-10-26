import { serializeTransaction } from "viem";

const tx = {
	type: "eip7702" as const,
	chainId: 1,
	nonce: 42,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gas: 100000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 0n,
	data: "0x",
	accessList: [],
	authorizationList: [
		{
			chainId: 1,
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
} as const;

export function main(): void {
	serializeTransaction(tx);
}
