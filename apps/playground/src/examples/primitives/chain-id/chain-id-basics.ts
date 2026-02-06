import { ChainId } from "@tevm/voltaire";

// From number (most common)
const mainnet = ChainId(1);
const sepolia = ChainId(11155111);
const polygon = ChainId(137);
const chain = ChainId(42161); // Arbitrum
const eth1 = ChainId(1);
const eth2 = ChainId(1);
const opt = ChainId(10);
// Chain ID is critical for replay protection in transactions
const txChainId = ChainId(1);
const networks = [
	{ name: "Ethereum Mainnet", id: ChainId(ChainId.MAINNET) },
	{ name: "Sepolia Testnet", id: ChainId(ChainId.SEPOLIA) },
	{ name: "Optimism", id: ChainId(ChainId.OPTIMISM) },
	{ name: "Arbitrum One", id: ChainId(ChainId.ARBITRUM) },
	{ name: "Base", id: ChainId(ChainId.BASE) },
	{ name: "Polygon", id: ChainId(ChainId.POLYGON) },
];

networks.forEach(({ name, id }) => {});
