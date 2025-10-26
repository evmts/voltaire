import { serializeTransaction } from "viem";

const tx = {
	type: "eip1559" as const,
	chainId: 1,
	nonce: 42,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gas: 21000n,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1000000000000000000n,
	data: "0x",
	accessList: [],
	v: 1n,
	r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
	s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
} as const;

export function main(): void {
	serializeTransaction(tx);
}
