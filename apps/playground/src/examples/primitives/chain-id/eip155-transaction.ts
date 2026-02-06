import { ChainId } from "@tevm/voltaire";

// Calculate EIP-155 v value
// v = CHAIN_ID * 2 + 35 + {0,1}
const calculateV = (chainId: number, recoveryId: 0 | 1): number => {
	const id = ChainId(chainId);
	return ChainId.toNumber(id) * 2 + 35 + recoveryId;
};

// Mainnet
const mainnet = ChainId(ChainId.MAINNET);

// Optimism
const optimism = ChainId(ChainId.OPTIMISM);

// Arbitrum
const arbitrum = ChainId(ChainId.ARBITRUM);

// Recover chainId from v
const recoverChainId = (v: number): number | null => {
	// v = chainId * 2 + 35 + {0,1}
	// chainId = (v - 35 - {0,1}) / 2
	// For v >= 35, try both recovery IDs
	if (v < 35) {
		return null; // Pre-EIP-155
	}

	const chainId1 = (v - 35) / 2; // Assuming recovery ID 0
	const chainId2 = (v - 36) / 2; // Assuming recovery ID 1

	// Return the integer result
	if (Number.isInteger(chainId1)) {
		return chainId1;
	}
	if (Number.isInteger(chainId2)) {
		return chainId2;
	}

	return null;
};
const testVValues = [37, 38, 55, 56, 84359, 84360];
testVValues.forEach((v) => {
	const recovered = recoverChainId(v);
	if (recovered !== null) {
		const chainId = ChainId(recovered);
	}
});

interface TransactionData {
	nonce: number;
	gasPrice: bigint;
	gasLimit: bigint;
	to: string;
	value: bigint;
	data: string;
	chainId: number;
}

const createTransaction = (chainId: number): TransactionData => {
	const id = ChainId(chainId);
	return {
		nonce: 0,
		gasPrice: 20000000000n,
		gasLimit: 21000n,
		to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
		value: 1000000000000000000n,
		data: "0x",
		chainId: ChainId.toNumber(id),
	};
};

// Create transactions for different networks
const mainnetTx = createTransaction(ChainId.MAINNET);

const baseTx = createTransaction(ChainId.BASE);
