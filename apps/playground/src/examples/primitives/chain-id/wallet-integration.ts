import { ChainId } from "@tevm/voltaire";

class WalletProvider {
	private currentChain: number;
	private supportedChains: Set<number>;

	constructor(initialChain: number, supportedChains: number[]) {
		this.currentChain = ChainId.toNumber(ChainId(initialChain));
		this.supportedChains = new Set(
			supportedChains.map((id) => ChainId.toNumber(ChainId(id))),
		);
	}

	getCurrentChainId(): number {
		return this.currentChain;
	}

	async switchChain(targetChain: number): Promise<boolean> {
		const target = ChainId(targetChain);
		const targetNum = ChainId.toNumber(target);

		if (!this.supportedChains.has(targetNum)) {
			return false;
		}

		if (ChainId.equals(ChainId(this.currentChain), target)) {
			return true;
		}
		this.currentChain = targetNum;
		return true;
	}

	async addChain(chainId: number, config: ChainConfig): Promise<boolean> {
		const chain = ChainId(chainId);
		const chainNum = ChainId.toNumber(chain);

		if (this.supportedChains.has(chainNum)) {
			return false;
		}
		this.supportedChains.add(chainNum);
		return true;
	}

	getSupportedChains(): number[] {
		return Array.from(this.supportedChains);
	}
}

interface ChainConfig {
	name: string;
	rpcUrl: string;
	blockExplorer?: string;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
}

// Initialize wallet with common chains
const wallet = new WalletProvider(ChainId.MAINNET, [
	ChainId.MAINNET,
	ChainId.SEPOLIA,
	ChainId.OPTIMISM,
	ChainId.ARBITRUM,
]);
await wallet.switchChain(ChainId.OPTIMISM);
await wallet.switchChain(ChainId.ARBITRUM);
await wallet.switchChain(ChainId.ARBITRUM); // Already on Arbitrum
await wallet.addChain(8453, {
	name: "Base",
	rpcUrl: "https://mainnet.base.org",
	blockExplorer: "https://basescan.org",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
});

await wallet.switchChain(ChainId.BASE);

interface TxRequest {
	from: string;
	to: string;
	value: bigint;
	data?: string;
	chainId?: number;
}

class TransactionManager {
	constructor(private wallet: WalletProvider) {}

	async sendTransaction(tx: TxRequest): Promise<string> {
		// Use current chain if not specified
		const chainId =
			tx.chainId !== undefined ? tx.chainId : this.wallet.getCurrentChainId();
		const chain = ChainId(chainId);
		const chainNum = ChainId.toNumber(chain);

		// Validate chain matches wallet
		const currentChain = ChainId(this.wallet.getCurrentChainId());
		if (!ChainId.equals(chain, currentChain)) {
			await this.wallet.switchChain(chainNum);
		}

		// Simulate transaction
		return `0x${Math.random().toString(16).slice(2)}`;
	}
}

const txManager = new TransactionManager(wallet);

// Send transaction on current chain (Base)
await txManager.sendTransaction({
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 1000000000000000000n,
});

// Send transaction with explicit chain (will trigger switch)
await txManager.sendTransaction({
	from: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	to: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
	value: 1000000000000000000n,
	chainId: ChainId.MAINNET,
});

class ChainGuard {
	constructor(
		private expectedChain: number,
		private wallet: WalletProvider,
	) {}

	async executeWithGuard<T>(operation: () => Promise<T>): Promise<T> {
		const expected = ChainId(this.expectedChain);
		const current = ChainId(this.wallet.getCurrentChainId());

		if (!ChainId.equals(current, expected)) {
			await this.wallet.switchChain(ChainId.toNumber(expected));
		}

		return operation();
	}
}

// Create guard for Optimism operations
const optimismGuard = new ChainGuard(ChainId.OPTIMISM, wallet);

await optimismGuard.executeWithGuard(async () => {
	return "result";
});

class BalanceChecker {
	constructor(private wallet: WalletProvider) {}

	async getBalanceOnChain(
		address: string,
		chainId: number,
	): Promise<{ chainId: number; balance: bigint }> {
		const chain = ChainId(chainId);
		const chainNum = ChainId.toNumber(chain);

		// Switch to target chain
		await this.wallet.switchChain(chainNum);

		// Simulate balance check
		const balance = BigInt(Math.floor(Math.random() * 10000000000000000000));

		return {
			chainId: chainNum,
			balance,
		};
	}

	async getBalancesAcrossChains(
		address: string,
		chainIds: number[],
	): Promise<Map<number, bigint>> {
		const balances = new Map<number, bigint>();

		for (const chainId of chainIds) {
			const { chainId: id, balance } = await this.getBalanceOnChain(
				address,
				chainId,
			);
			balances.set(id, balance);
		}

		return balances;
	}
}

const checker = new BalanceChecker(wallet);
const balances = await checker.getBalancesAcrossChains(
	"0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	[ChainId.MAINNET, ChainId.OPTIMISM, ChainId.ARBITRUM],
);
for (const [chainId, balance] of balances) {
}
