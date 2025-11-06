/**
 * Chain metadata for popular chains
 * Includes hardfork info, block times, gas limits, and L2 classifications
 */

export type Hardfork =
	| "chainstart"
	| "homestead"
	| "dao"
	| "tangerineWhistle"
	| "spuriousDragon"
	| "byzantium"
	| "constantinople"
	| "petersburg"
	| "istanbul"
	| "muirGlacier"
	| "berlin"
	| "london"
	| "arrowGlacier"
	| "grayGlacier"
	| "paris"
	| "shanghai"
	| "cancun"
	| "prague";

export interface ChainMetadata {
	/** Average block time in seconds */
	blockTime: number;
	/** Block gas limit */
	gasLimit: number;
	/** Whether this is a testnet */
	isTestnet: boolean;
	/** Whether this is an L2 */
	isL2: boolean;
	/** Parent L1 chain ID if this is an L2 */
	l1ChainId?: number;
	/** Latest active hardfork */
	latestHardfork: Hardfork;
	/** Hardfork activation blocks */
	hardforks: Partial<Record<Hardfork, number>>;
	/** WebSocket RPC URLs */
	websocketUrls?: string[];
}

/**
 * Metadata for popular chains
 */
export const CHAIN_METADATA: Record<number, ChainMetadata> = {
	// Ethereum Mainnet
	1: {
		blockTime: 12,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			chainstart: 0,
			homestead: 1_150_000,
			dao: 1_920_000,
			tangerineWhistle: 2_463_000,
			spuriousDragon: 2_675_000,
			byzantium: 4_370_000,
			constantinople: 7_280_000,
			petersburg: 7_280_000,
			istanbul: 9_069_000,
			muirGlacier: 9_200_000,
			berlin: 12_244_000,
			london: 12_965_000,
			arrowGlacier: 13_773_000,
			grayGlacier: 15_050_000,
			paris: 15_537_394,
			shanghai: 17_034_870,
			cancun: 19_426_587,
		},
		websocketUrls: [
			"wss://ethereum-rpc.publicnode.com",
			"wss://eth.drpc.org",
		],
	},

	// Sepolia Testnet
	11155111: {
		blockTime: 12,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			chainstart: 0,
			london: 0,
			paris: 1_735_371,
			shanghai: 2_990_908,
			cancun: 5_187_023,
		},
		websocketUrls: ["wss://ethereum-sepolia-rpc.publicnode.com"],
	},

	// Holesky Testnet
	17000: {
		blockTime: 12,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			chainstart: 0,
			paris: 0,
			shanghai: 6698,
			cancun: 894733,
		},
		websocketUrls: ["wss://ethereum-holesky-rpc.publicnode.com"],
	},

	// Optimism Mainnet
	10: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 117387812,
		},
		websocketUrls: ["wss://optimism-rpc.publicnode.com"],
	},

	// Optimism Sepolia
	11155420: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 8403392,
		},
		websocketUrls: ["wss://optimism-sepolia-rpc.publicnode.com"],
	},

	// Arbitrum One
	42161: {
		blockTime: 0.25,
		gasLimit: 32_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 189153517,
		},
		websocketUrls: ["wss://arbitrum-one-rpc.publicnode.com"],
	},

	// Arbitrum Sepolia
	421614: {
		blockTime: 0.25,
		gasLimit: 32_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 33772963,
		},
		websocketUrls: ["wss://arbitrum-sepolia-rpc.publicnode.com"],
	},

	// Polygon Mainnet
	137: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			london: 23850000,
			cancun: 54876000,
		},
		websocketUrls: ["wss://polygon-bor-rpc.publicnode.com"],
	},

	// Polygon Amoy
	80002: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 6594854,
		},
		websocketUrls: ["wss://polygon-amoy-bor-rpc.publicnode.com"],
	},

	// Base Mainnet
	8453: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 11188936,
		},
		websocketUrls: ["wss://base-rpc.publicnode.com"],
	},

	// Base Sepolia
	84532: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {
			cancun: 6383256,
		},
		websocketUrls: ["wss://base-sepolia-rpc.publicnode.com"],
	},

	// Linea Mainnet
	59144: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Linea Sepolia
	59141: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// zkSync Era Mainnet
	324: {
		blockTime: 1,
		gasLimit: 80_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {},
		websocketUrls: ["wss://mainnet.era.zksync.io/ws"],
	},

	// zkSync Era Sepolia
	300: {
		blockTime: 1,
		gasLimit: 80_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {},
		websocketUrls: ["wss://sepolia.era.zksync.dev/ws"],
	},

	// Scroll Mainnet
	534352: {
		blockTime: 3,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Scroll Sepolia
	534351: {
		blockTime: 3,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Blast Mainnet
	81457: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: true,
		l1ChainId: 1,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Blast Sepolia
	168587773: {
		blockTime: 2,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: true,
		l1ChainId: 11155111,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Avalanche C-Chain
	43114: {
		blockTime: 2,
		gasLimit: 15_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
		websocketUrls: ["wss://avalanche-c-chain-rpc.publicnode.com"],
	},

	// Avalanche Fuji
	43113: {
		blockTime: 2,
		gasLimit: 15_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
		websocketUrls: ["wss://avalanche-fuji-c-chain-rpc.publicnode.com"],
	},

	// BSC Mainnet
	56: {
		blockTime: 3,
		gasLimit: 140_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// BSC Testnet
	97: {
		blockTime: 3,
		gasLimit: 140_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Fantom Opera
	250: {
		blockTime: 1,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Fantom Testnet
	4002: {
		blockTime: 1,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Gnosis Chain
	100: {
		blockTime: 5,
		gasLimit: 30_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			constantinople: 10740904,
			istanbul: 12095200,
			berlin: 19040000,
			london: 19040000,
			paris: 26138654,
			shanghai: 29794725,
			cancun: 35800000,
		},
	},

	// Chiado Testnet (Gnosis)
	10200: {
		blockTime: 5,
		gasLimit: 30_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {
			shanghai: 7862000,
			cancun: 11907388,
		},
	},

	// Moonbeam
	1284: {
		blockTime: 12,
		gasLimit: 15_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Moonbase Alpha
	1287: {
		blockTime: 12,
		gasLimit: 15_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Celo Mainnet
	42220: {
		blockTime: 5,
		gasLimit: 50_000_000,
		isTestnet: false,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},

	// Celo Alfajores
	44787: {
		blockTime: 5,
		gasLimit: 50_000_000,
		isTestnet: true,
		isL2: false,
		latestHardfork: "cancun",
		hardforks: {},
	},
};

/**
 * Default metadata for chains not in the registry
 */
export const DEFAULT_METADATA: ChainMetadata = {
	blockTime: 12,
	gasLimit: 30_000_000,
	isTestnet: false,
	isL2: false,
	latestHardfork: "cancun",
	hardforks: {},
};
