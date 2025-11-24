import * as ChainId from "../../../primitives/ChainId/index.js";
const ethereumChains = [
	{ name: "Ethereum Mainnet", id: ChainId.MAINNET },
	{ name: "Sepolia (testnet)", id: ChainId.SEPOLIA },
	{ name: "Holesky (testnet)", id: ChainId.HOLESKY },
	{ name: "Goerli (deprecated)", id: ChainId.GOERLI },
];

ethereumChains.forEach(({ name, id }) => {});
const l2Chains = [
	{ name: "Optimism", id: ChainId.OPTIMISM },
	{ name: "Arbitrum One", id: ChainId.ARBITRUM },
	{ name: "Base", id: ChainId.BASE },
	{ name: "Arbitrum Nova", id: 42170 },
	{ name: "zkSync Era", id: 324 },
	{ name: "Polygon zkEVM", id: 1101 },
	{ name: "Linea", id: 59144 },
	{ name: "Scroll", id: 534352 },
];

l2Chains.forEach(({ name, id }) => {});
const sideChains = [
	{ name: "Polygon PoS", id: ChainId.POLYGON },
	{ name: "Gnosis Chain", id: 100 },
	{ name: "BNB Smart Chain", id: 56 },
	{ name: "Avalanche C-Chain", id: 43114 },
];

sideChains.forEach(({ name, id }) => {});
const devChains = [
	{ name: "Hardhat", id: 31337 },
	{ name: "Anvil", id: 31337 },
	{ name: "Ganache", id: 1337 },
];

devChains.forEach(({ name, id }) => {});
const detectChain = (chainId: number) => {
	const id = ChainId.from(chainId);
	if (ChainId.isMainnet(id)) {
		return "Ethereum Mainnet";
	}
	if (ChainId.equals(id, ChainId.OPTIMISM)) {
		return "Optimism";
	}
	if (ChainId.equals(id, ChainId.ARBITRUM)) {
		return "Arbitrum One";
	}
	if (ChainId.equals(id, ChainId.BASE)) {
		return "Base";
	}
	if (ChainId.equals(id, ChainId.POLYGON)) {
		return "Polygon";
	}
	return "Unknown Chain";
};
