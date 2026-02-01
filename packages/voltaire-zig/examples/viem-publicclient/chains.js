/**
 * Chain Definitions
 *
 * Common chain configurations.
 *
 * @module examples/viem-publicclient/chains
 */

/**
 * @typedef {import('./PublicClientType.js').Chain} Chain
 */

/** @type {Chain} */
export const mainnet = {
	id: 1,
	name: "Ethereum",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://cloudflare-eth.com"],
		},
	},
	blockTime: 12_000,
	blockExplorers: {
		default: {
			name: "Etherscan",
			url: "https://etherscan.io",
		},
	},
};

/** @type {Chain} */
export const sepolia = {
	id: 11155111,
	name: "Sepolia",
	nativeCurrency: {
		name: "Sepolia Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://rpc.sepolia.org"],
		},
	},
	blockTime: 12_000,
	blockExplorers: {
		default: {
			name: "Etherscan",
			url: "https://sepolia.etherscan.io",
		},
	},
};

/** @type {Chain} */
export const optimism = {
	id: 10,
	name: "OP Mainnet",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://mainnet.optimism.io"],
		},
	},
	blockTime: 2_000,
	blockExplorers: {
		default: {
			name: "Optimism Explorer",
			url: "https://optimistic.etherscan.io",
		},
	},
};

/** @type {Chain} */
export const arbitrum = {
	id: 42161,
	name: "Arbitrum One",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://arb1.arbitrum.io/rpc"],
		},
	},
	blockTime: 250,
	blockExplorers: {
		default: {
			name: "Arbiscan",
			url: "https://arbiscan.io",
		},
	},
};

/** @type {Chain} */
export const polygon = {
	id: 137,
	name: "Polygon",
	nativeCurrency: {
		name: "POL",
		symbol: "POL",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://polygon-rpc.com"],
		},
	},
	blockTime: 2_000,
	blockExplorers: {
		default: {
			name: "Polygonscan",
			url: "https://polygonscan.com",
		},
	},
};

/** @type {Chain} */
export const base = {
	id: 8453,
	name: "Base",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://mainnet.base.org"],
		},
	},
	blockTime: 2_000,
	blockExplorers: {
		default: {
			name: "Basescan",
			url: "https://basescan.org",
		},
	},
};
