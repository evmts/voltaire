import { Transaction } from "ethers";

// Convert to ethers format
const tx = Transaction.from({
	nonce: 42,
	gasPrice: 20000000000n,
	gasLimit: 21000,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1000000000000000000n,
	data: "0x",
	chainId: 1,
	signature: {
		v: 37,
		r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
		s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
	},
});

export function main(): void {
	tx.serialized;
}
