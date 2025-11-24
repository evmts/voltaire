import * as ChainId from "../../../primitives/ChainId/index.js";

const mainnet = ChainId.from(1);
const optimism = ChainId.from(10);
const custom = ChainId.from(12345);

// Production safety: prevent accidental mainnet operations
const isDangerousOperation = (chainId: number, operation: string): boolean => {
	const chain = ChainId.from(chainId);
	if (ChainId.isMainnet(chain)) {
		return true;
	}
	return false;
};

isDangerousOperation(1, "Deploying experimental contract");
isDangerousOperation(11155111, "Deploying experimental contract");

interface DeployConfig {
	chainId: number;
	gasPrice: bigint;
	confirmations: number;
}

const getDeployConfig = (chainId: number): DeployConfig => {
	const chain = ChainId.from(chainId);

	if (ChainId.isMainnet(chain)) {
		return {
			chainId: ChainId.toNumber(chain),
			gasPrice: 30000000000n, // Higher for mainnet
			confirmations: 5, // Wait for more confirmations
		};
	}

	// Testnet/custom chain
	return {
		chainId: ChainId.toNumber(chain),
		gasPrice: 1000000000n, // Lower for testnets
		confirmations: 1, // Faster for development
	};
};

class FeatureManager {
	private enabledOnMainnet: Set<string>;

	constructor() {
		this.enabledOnMainnet = new Set(["stable_swap", "token_bridge", "staking"]);
	}

	isFeatureEnabled(feature: string, chainId: number): boolean {
		const chain = ChainId.from(chainId);

		// All features enabled on testnets
		if (!ChainId.isMainnet(chain)) {
			return true;
		}

		// Only specific features on mainnet
		return this.enabledOnMainnet.has(feature);
	}
}

const features = new FeatureManager();

const testFeatures = [
	"stable_swap",
	"experimental_amm",
	"token_bridge",
	"beta_lending",
];
testFeatures.forEach((feature) => {
	const onMainnet = features.isFeatureEnabled(feature, ChainId.MAINNET);
	const onTestnet = features.isFeatureEnabled(feature, ChainId.SEPOLIA);
});

const getRateLimitForChain = (
	chainId: number,
): { requestsPerSecond: number; burstSize: number } => {
	const chain = ChainId.from(chainId);

	if (ChainId.isMainnet(chain)) {
		return {
			requestsPerSecond: 5, // Conservative for mainnet
			burstSize: 10,
		};
	}

	return {
		requestsPerSecond: 100, // Generous for testnets
		burstSize: 200,
	};
};

const estimateOperationCost = (
	chainId: number,
	operation: string,
): { cost: bigint; currency: string } => {
	const chain = ChainId.from(chainId);

	if (ChainId.isMainnet(chain)) {
		return {
			cost: 100000000000000000n, // 0.1 ETH
			currency: "ETH",
		};
	}

	return {
		cost: 0n,
		currency: "Test ETH",
	};
};

const mainnetCost = estimateOperationCost(ChainId.MAINNET, "deploy");
const testnetCost = estimateOperationCost(ChainId.SEPOLIA, "deploy");

type NetworkClass = "production" | "staging" | "development";

const classifyNetwork = (chainId: number): NetworkClass => {
	const chain = ChainId.from(chainId);

	if (ChainId.isMainnet(chain)) {
		return "production";
	}

	if (
		ChainId.equals(chain, ChainId.from(ChainId.SEPOLIA)) ||
		ChainId.equals(chain, ChainId.from(ChainId.HOLESKY))
	) {
		return "staging";
	}

	return "development";
};

const chains = [
	ChainId.MAINNET,
	ChainId.SEPOLIA,
	ChainId.HOLESKY,
	31337, // Local
	999999, // Custom
];
chains.forEach((id) => {});
