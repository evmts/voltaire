import { ChainId } from "@tevm/voltaire";

// Private/enterprise chains often use custom chain IDs
const customChains = [
	{ name: "Private Enterprise Chain", id: 100001 },
	{ name: "Development Fork", id: 1337 },
	{ name: "Internal Testnet", id: 999999 },
	{ name: "Company Sidechain", id: 424242 },
];
customChains.forEach(({ name, id }) => {
	const chainId = ChainId(id);
});

// Common local development chain IDs
const localChains = [
	{ name: "Hardhat/Anvil Default", id: 31337 },
	{ name: "Ganache Default", id: 1337 },
	{ name: "Custom Local", id: 12345 },
];

localChains.forEach(({ name, id }) => {
	const chainId = ChainId(id);
});

interface ChainConfig {
	chainId: number;
	name: string;
	rpcUrl: string;
	blockExplorer?: string;
}

const createChainConfig = (
	chainId: number,
	name: string,
	rpcUrl: string,
	blockExplorer?: string,
): ChainConfig => {
	// Validate chain ID
	const id = ChainId(chainId);

	return {
		chainId: ChainId.toNumber(id),
		name,
		rpcUrl,
		blockExplorer,
	};
};

// Custom chain configurations
const privateChain = createChainConfig(
	888888,
	"My Private Chain",
	"http://localhost:8545",
);

const stagingChain = createChainConfig(
	555555,
	"Staging Network",
	"https://staging-rpc.example.com",
	"https://staging-explorer.example.com",
);

class MultiChainApp {
	private supportedChains: Set<number>;

	constructor(chainIds: number[]) {
		// Validate all chain IDs during initialization
		this.supportedChains = new Set(
			chainIds.map((id) => ChainId.toNumber(ChainId(id))),
		);
	}

	isSupported(chainId: number): boolean {
		const id = ChainId(chainId);
		return this.supportedChains.has(ChainId.toNumber(id));
	}

	getSupportedChains(): number[] {
		return Array.from(this.supportedChains);
	}
}

// App supporting both public and custom chains
const app = new MultiChainApp([
	ChainId.MAINNET, // Public: Ethereum
	ChainId.POLYGON, // Public: Polygon
	888888, // Custom: Private chain
	555555, // Custom: Staging
]);

interface ChainMetadata {
	chainId: number;
	name: string;
	type: "mainnet" | "testnet" | "custom";
}

class ChainRegistry {
	private chains = new Map<number, ChainMetadata>();

	register(chainId: number, name: string, type: ChainMetadata["type"]): void {
		const id = ChainId(chainId);
		const numericId = ChainId.toNumber(id);

		this.chains.set(numericId, {
			chainId: numericId,
			name,
			type,
		});
	}

	get(chainId: number): ChainMetadata | undefined {
		const id = ChainId(chainId);
		return this.chains.get(ChainId.toNumber(id));
	}

	getAll(type?: ChainMetadata["type"]): ChainMetadata[] {
		const all = Array.from(this.chains.values());
		return type ? all.filter((chain) => chain.type === type) : all;
	}
}

const registry = new ChainRegistry();

// Register public chains
registry.register(ChainId.MAINNET, "Ethereum Mainnet", "mainnet");
registry.register(ChainId.SEPOLIA, "Sepolia", "testnet");

// Register custom chains
registry.register(888888, "Private Chain", "custom");
registry.register(555555, "Staging Network", "custom");
