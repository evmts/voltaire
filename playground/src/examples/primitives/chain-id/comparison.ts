import * as ChainId from "../../../primitives/ChainId/index.js";

const mainnet1 = ChainId.from(1);
const mainnet2 = ChainId.from(1);
const optimism = ChainId.from(10);

const userChain = ChainId.from(1);

const validateNetwork = (chainId: number, expectedChainId: number): boolean => {
	const actual = ChainId.from(chainId);
	const expected = ChainId.from(expectedChainId);
	return ChainId.equals(actual, expected);
};

// Check if user is on expected network
const currentChainId = 42161; // Arbitrum
const expectedChainId = 42161; // Expecting Arbitrum

if (validateNetwork(currentChainId, expectedChainId)) {
} else {
}

const supportedChains = [
	ChainId.from(ChainId.MAINNET),
	ChainId.from(ChainId.OPTIMISM),
	ChainId.from(ChainId.ARBITRUM),
	ChainId.from(ChainId.BASE),
];

const isSupported = (chainId: number): boolean => {
	const chain = ChainId.from(chainId);
	return supportedChains.some((supported) => ChainId.equals(chain, supported));
};

const isMainnet = (chainId: number): boolean => {
	return ChainId.isMainnet(ChainId.from(chainId));
};

const isL2 = (chainId: number): boolean => {
	const chain = ChainId.from(chainId);
	return (
		ChainId.equals(chain, ChainId.from(ChainId.OPTIMISM)) ||
		ChainId.equals(chain, ChainId.from(ChainId.ARBITRUM)) ||
		ChainId.equals(chain, ChainId.from(ChainId.BASE))
	);
};

const testChains = [1, 10, 42161, 8453, 137];
testChains.forEach((id) => {
	const chain = ChainId.from(id);
});

interface Transaction {
	chainId: number;
	from: string;
	to: string;
	value: bigint;
}

const validateTransaction = (
	tx: Transaction,
	expectedChainId: number,
): { valid: boolean; error?: string } => {
	const txChain = ChainId.from(tx.chainId);
	const expected = ChainId.from(expectedChainId);

	if (!ChainId.equals(txChain, expected)) {
		return {
			valid: false,
			error: `Chain ID mismatch: expected ${ChainId.toNumber(expected)}, got ${ChainId.toNumber(txChain)}`,
		};
	}

	return { valid: true };
};

// Valid transaction
const validTx: Transaction = {
	chainId: ChainId.MAINNET,
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 1000000000000000000n,
};

const validResult = validateTransaction(validTx, ChainId.MAINNET);

// Invalid transaction (wrong chain)
const invalidTx: Transaction = {
	chainId: ChainId.OPTIMISM,
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 1000000000000000000n,
};

const invalidResult = validateTransaction(invalidTx, ChainId.MAINNET);

class ChainManager {
	private currentChain: number;

	constructor(initialChain: number) {
		this.currentChain = ChainId.toNumber(ChainId.from(initialChain));
	}

	getCurrentChain(): number {
		return this.currentChain;
	}

	switchChain(newChain: number): boolean {
		const current = ChainId.from(this.currentChain);
		const target = ChainId.from(newChain);

		if (ChainId.equals(current, target)) {
			return false;
		}

		this.currentChain = ChainId.toNumber(target);
		return true;
	}

	isOnChain(chainId: number): boolean {
		const current = ChainId.from(this.currentChain);
		const target = ChainId.from(chainId);
		return ChainId.equals(current, target);
	}
}

const manager = new ChainManager(ChainId.MAINNET);
manager.switchChain(ChainId.OPTIMISM);
manager.switchChain(ChainId.OPTIMISM); // No-op
