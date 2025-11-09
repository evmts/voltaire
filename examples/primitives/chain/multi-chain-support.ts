/**
 * Chain Example 3: Multi-Chain Support
 *
 * Demonstrates:
 * - Building multi-chain applications
 * - Chain validation and filtering
 * - Creating chain configuration registries
 * - Network switching logic
 */

import { Chain } from "../../../src/primitives/Chain/Chain.js";

const SUPPORTED_CHAIN_IDS = [1, 10, 42161, 8453, 137] as const;

type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

// Validate if chain is supported
function isChainSupported(chainId: number): chainId is SupportedChainId {
	return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

// Get all supported chains
function getSupportedChains() {
	return SUPPORTED_CHAIN_IDS.map((id) => Chain.fromId(id)).filter(
		(chain): chain is NonNullable<typeof chain> => chain !== undefined,
	);
}

const supportedChains = getSupportedChains();

supportedChains.forEach((chain) => {});

interface ChainConfig {
	chainId: number;
	enabled: boolean;
	rpcUrl?: string;
	maxGasPrice?: bigint;
	confirmations: number;
}

const chainConfigs: Record<number, ChainConfig> = {
	1: {
		chainId: 1,
		enabled: true,
		rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/demo",
		maxGasPrice: 100_000_000_000n, // 100 gwei
		confirmations: 12,
	},
	10: {
		chainId: 10,
		enabled: true,
		confirmations: 1,
	},
	42161: {
		chainId: 42161,
		enabled: true,
		confirmations: 1,
	},
	8453: {
		chainId: 8453,
		enabled: false, // Temporarily disabled
		confirmations: 1,
	},
};

// Get chain config with defaults from Chain metadata
function getChainConfig(
	chainId: number,
): (ChainConfig & { name: string }) | null {
	const config = chainConfigs[chainId];
	const chain = Chain.fromId(chainId);

	if (!config || !chain) {
		return null;
	}

	return {
		...config,
		name: chain.name,
		rpcUrl: config.rpcUrl ?? chain.rpc[0],
	};
}

Object.keys(chainConfigs).forEach((id) => {
	const config = getChainConfig(Number(id));
	if (config) {
		if (config.maxGasPrice) {
		}
	}
});

let currentChainId: number | null = null;

function switchNetwork(newChainId: number): boolean {
	if (!isChainSupported(newChainId)) {
		return false;
	}

	const config = getChainConfig(newChainId);
	if (!config || !config.enabled) {
		return false;
	}

	const chain = Chain.fromId(newChainId);
	if (!chain) {
		return false;
	}

	currentChainId = newChainId;
	return true;
}

switchNetwork(1);
switchNetwork(8453); // Disabled
switchNetwork(999); // Not supported

function compareChains(chainId1: number, chainId2: number): void {
	const chain1 = Chain.fromId(chainId1);
	const chain2 = Chain.fromId(chainId2);

	if (!chain1 || !chain2) {
		return;
	}
}

compareChains(1, 10);
compareChains(9, 14);

// Get all chains with ETH as native currency
function getChainsWithSymbol(symbol: string): number[] {
	const chainIds: number[] = [];

	// Check supported chains
	for (const id of SUPPORTED_CHAIN_IDS) {
		const chain = Chain.fromId(id);
		if (chain?.nativeCurrency.symbol === symbol) {
			chainIds.push(id);
		}
	}

	return chainIds;
}

const ethChains = getChainsWithSymbol("ETH");
ethChains.forEach((id) => {
	const chain = Chain.fromId(id);
	if (chain) {
	}
});

interface ChainStatus {
	chainId: number;
	name: string;
	hasRpc: boolean;
	hasExplorer: boolean;
	supported: boolean;
}

function checkChainStatus(chainId: number): ChainStatus | null {
	const chain = Chain.fromId(chainId);
	if (!chain) return null;

	return {
		chainId: chain.chainId,
		name: chain.name,
		hasRpc: chain.rpc.length > 0,
		hasExplorer: !!chain.explorers?.[0],
		supported: isChainSupported(chainId),
	};
}

const checkChains = [1, 9, 10, 42161];
checkChains.forEach((id) => {
	const status = checkChainStatus(id);
	if (status) {
	}
});
