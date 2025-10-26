import { Transaction } from "ethers";

const legacyTx = Transaction.from({
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

const eip1559Tx = Transaction.from({
	type: 2,
	chainId: 1,
	nonce: 42,
	maxPriorityFeePerGas: 2000000000n,
	maxFeePerGas: 50000000000n,
	gasLimit: 21000,
	to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
	value: 1000000000000000000n,
	data: "0x",
	accessList: [],
	signature: {
		v: 1,
		r: "0x9a2cbd3e0c3c3f9b5e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e",
		s: "0x7d3e2c9b8f0e2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6a9e8e8f1e0e8f2c6",
	},
});

export function main(): void {
	legacyTx.hash;
	eip1559Tx.hash;
	// Note: Ethers does not support EIP-7702 yet
}
