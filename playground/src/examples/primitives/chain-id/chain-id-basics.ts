import { ChainId } from "voltaire";

// From number (most common)
const mainnet = ChainId.from(1);
const sepolia = ChainId.from(11155111);
const polygon = ChainId.from(137);
const chain = ChainId.from(42161); // Arbitrum
const eth1 = ChainId.from(1);
const eth2 = ChainId.from(1);
const opt = ChainId.from(10);
// Chain ID is critical for replay protection in transactions
const txChainId = ChainId.from(1);
const networks = [
	{ name: "Ethereum Mainnet", id: ChainId.from(ChainId.MAINNET) },
	{ name: "Sepolia Testnet", id: ChainId.from(ChainId.SEPOLIA) },
	{ name: "Optimism", id: ChainId.from(ChainId.OPTIMISM) },
	{ name: "Arbitrum One", id: ChainId.from(ChainId.ARBITRUM) },
	{ name: "Base", id: ChainId.from(ChainId.BASE) },
	{ name: "Polygon", id: ChainId.from(ChainId.POLYGON) },
];

networks.forEach(({ name, id }) => {});
