/**
 * Built-in registry of canonical EVM chains indexed by EIP-155 chain ID
 *
 * @see https://voltaire.tevm.sh/primitives/chain for Chain documentation
 * @since 0.0.0
 * @type {Record<number, import('./ChainType.js').Chain>}
 * @example
 * ```javascript
 * import * as Chain from './primitives/Chain/index.js';
 * const mainnet = Chain.byId[1];
 * const optimism = Chain.byId[10];
 * ```
 */
export const byId = {
	1: {
		name: "Ethereum Mainnet",
		chain: "ETH",
		chainId: 1,
		networkId: 1,
		shortName: "eth",
		rpc: ["https://ethereum-rpc.publicnode.com"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://ethereum.org",
		explorers: [
			{
				name: "etherscan",
				url: "https://etherscan.io",
				standard: "EIP3091",
			},
		],
	},
	10: {
		name: "OP Mainnet",
		chain: "ETH",
		chainId: 10,
		networkId: 10,
		shortName: "oeth",
		rpc: ["https://mainnet.optimism.io"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://optimism.io",
		explorers: [
			{
				name: "etherscan",
				url: "https://optimistic.etherscan.io",
				standard: "EIP3091",
			},
		],
	},
	56: {
		name: "BNB Smart Chain Mainnet",
		chain: "BSC",
		chainId: 56,
		networkId: 56,
		shortName: "bnb",
		rpc: ["https://bsc-dataseed.bnbchain.org"],
		nativeCurrency: {
			name: "BNB Chain Native Token",
			symbol: "BNB",
			decimals: 18,
		},
		infoURL: "https://www.bnbchain.org/en",
		explorers: [
			{
				name: "bscscan",
				url: "https://bscscan.com",
				standard: "EIP3091",
			},
		],
	},
	100: {
		name: "Gnosis",
		chain: "GNO",
		chainId: 100,
		networkId: 100,
		shortName: "gno",
		rpc: ["https://rpc.gnosischain.com"],
		nativeCurrency: { name: "xDAI", symbol: "XDAI", decimals: 18 },
		infoURL: "https://docs.gnosischain.com",
		explorers: [
			{
				name: "gnosisscan",
				url: "https://gnosisscan.io",
				standard: "EIP3091",
			},
		],
	},
	137: {
		name: "Polygon Mainnet",
		chain: "Polygon",
		chainId: 137,
		networkId: 137,
		shortName: "pol",
		rpc: ["https://polygon-rpc.com"],
		nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
		infoURL: "https://polygon.technology/",
		explorers: [
			{
				name: "polygonscan",
				url: "https://polygonscan.com",
				standard: "EIP3091",
			},
		],
	},
	324: {
		name: "zkSync Mainnet",
		chain: "ETH",
		chainId: 324,
		networkId: 324,
		shortName: "zksync",
		rpc: ["https://mainnet.era.zksync.io"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://zksync.io/",
		explorers: [
			{
				name: "zkSync Era Block Explorer",
				url: "https://explorer.zksync.io",
				standard: "EIP3091",
			},
		],
	},
	8453: {
		name: "Base",
		chain: "ETH",
		chainId: 8453,
		networkId: 8453,
		shortName: "base",
		rpc: ["https://mainnet.base.org"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://base.org",
		explorers: [
			{
				name: "basescan",
				url: "https://basescan.org",
				standard: "EIP3091",
			},
		],
	},
	17000: {
		name: "Holesky",
		chain: "ETH",
		chainId: 17000,
		networkId: 17000,
		shortName: "holesky",
		rpc: ["https://ethereum-holesky-rpc.publicnode.com"],
		nativeCurrency: { name: "Testnet ETH", symbol: "ETH", decimals: 18 },
		infoURL: "https://holesky.ethpandaops.io",
		explorers: [
			{
				name: "Holesky Etherscan",
				url: "https://holesky.etherscan.io",
				standard: "EIP3091",
			},
		],
	},
	34443: {
		name: "Mode",
		chain: "ETH",
		chainId: 34443,
		networkId: 34443,
		shortName: "mode",
		rpc: ["https://mainnet.mode.network"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://docs.mode.network/",
		explorers: [
			{
				name: "modescout",
				url: "https://explorer.mode.network",
				standard: "none",
			},
		],
	},
	42161: {
		name: "Arbitrum One",
		chain: "ETH",
		chainId: 42161,
		networkId: 42161,
		shortName: "arb1",
		rpc: ["https://arb1.arbitrum.io/rpc"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://arbitrum.io",
		explorers: [
			{
				name: "Arbiscan",
				url: "https://arbiscan.io",
				standard: "EIP3091",
			},
		],
	},
	43114: {
		name: "Avalanche C-Chain",
		chain: "AVAX",
		chainId: 43114,
		networkId: 43114,
		shortName: "avax",
		rpc: ["https://api.avax.network/ext/bc/C/rpc"],
		nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
		infoURL: "https://www.avax.network/",
		explorers: [
			{
				name: "snowtrace",
				url: "https://snowtrace.io",
				standard: "EIP3091",
			},
		],
	},
	59144: {
		name: "Linea",
		chain: "ETH",
		chainId: 59144,
		networkId: 59144,
		shortName: "linea",
		rpc: ["https://rpc.linea.build"],
		nativeCurrency: { name: "Linea Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://linea.build",
		explorers: [
			{
				name: "Lineascan",
				url: "https://lineascan.build",
				standard: "EIP3091",
			},
		],
	},
	81457: {
		name: "Blast",
		chain: "ETH",
		chainId: 81457,
		networkId: 81457,
		shortName: "blastmainnet",
		rpc: ["https://rpc.blast.io"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://blast.io/",
		explorers: [
			{
				name: "Blastscan",
				url: "https://blastscan.io",
				standard: "EIP3091",
			},
		],
	},
	534352: {
		name: "Scroll",
		chain: "ETH",
		chainId: 534352,
		networkId: 534352,
		shortName: "scr",
		rpc: ["https://rpc.scroll.io"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://scroll.io",
		explorers: [
			{
				name: "Scrollscan",
				url: "https://scrollscan.com",
				standard: "EIP3091",
			},
		],
	},
	560048: {
		name: "Hoodi",
		chain: "ETH",
		chainId: 560048,
		networkId: 560048,
		shortName: "hoodi",
		rpc: ["https://ethereum-hoodi-rpc.publicnode.com"],
		nativeCurrency: { name: "Hoodi Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://hoodi.ethpandaops.io",
		explorers: [
			{
				name: "Hoodi Etherscan",
				url: "https://hoodi.etherscan.io",
				standard: "EIP3091",
			},
		],
	},
	7777777: {
		name: "Zora",
		chain: "ETH",
		chainId: 7777777,
		networkId: 7777777,
		shortName: "zora",
		rpc: ["https://rpc.zora.energy"],
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://zora.energy",
		explorers: [
			{
				name: "Zora Network Explorer",
				url: "https://explorer.zora.energy",
				standard: "EIP3091",
			},
		],
	},
	11155111: {
		name: "Sepolia",
		chain: "ETH",
		chainId: 11155111,
		networkId: 11155111,
		shortName: "sep",
		rpc: ["https://ethereum-sepolia-rpc.publicnode.com"],
		nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
		infoURL: "https://sepolia.otterscan.io",
		explorers: [
			{
				name: "etherscan-sepolia",
				url: "https://sepolia.etherscan.io",
				standard: "EIP3091",
			},
		],
	},
};
