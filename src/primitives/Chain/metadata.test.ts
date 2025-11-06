import { describe, expect, it } from "vitest";
import { Chain } from "./Chain.js";
import type { Chain as ChainType } from "./ChainType.js";

// Mock chain objects for testing
const mainnet: ChainType = {
	name: "Ethereum Mainnet",
	chain: "ETH",
	chainId: 1,
	shortName: "eth",
	rpc: ["https://eth.llamarpc.com"],
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
	explorers: [
		{
			name: "etherscan",
			url: "https://etherscan.io",
			standard: "EIP3091",
		},
	],
};

const sepolia: ChainType = {
	name: "Sepolia",
	chain: "ETH",
	chainId: 11155111,
	shortName: "sep",
	rpc: ["https://rpc.sepolia.org"],
	nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
};

const optimism: ChainType = {
	name: "OP Mainnet",
	chain: "ETH",
	chainId: 10,
	shortName: "oeth",
	rpc: ["https://mainnet.optimism.io"],
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const arbitrum: ChainType = {
	name: "Arbitrum One",
	chain: "ETH",
	chainId: 42161,
	shortName: "arb1",
	rpc: ["https://arb1.arbitrum.io/rpc"],
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const base: ChainType = {
	name: "Base",
	chain: "ETH",
	chainId: 8453,
	shortName: "base",
	rpc: ["https://mainnet.base.org"],
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const optimismSepolia: ChainType = {
	name: "OP Sepolia Testnet",
	chain: "ETH",
	chainId: 11155420,
	shortName: "opsep",
	rpc: ["https://sepolia.optimism.io"],
	nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
};

const polygon: ChainType = {
	name: "Polygon Mainnet",
	chain: "Polygon",
	chainId: 137,
	shortName: "matic",
	rpc: ["https://polygon-rpc.com"],
	nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
};

const zkSync: ChainType = {
	name: "zkSync Era Mainnet",
	chain: "ZKsync",
	chainId: 324,
	shortName: "zksync",
	rpc: ["https://mainnet.era.zksync.io"],
	nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

const avalanche: ChainType = {
	name: "Avalanche C-Chain",
	chain: "AVAX",
	chainId: 43114,
	shortName: "avax",
	rpc: ["https://api.avax.network/ext/bc/C/rpc"],
	nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
};

const bsc: ChainType = {
	name: "BNB Smart Chain Mainnet",
	chain: "BSC",
	chainId: 56,
	shortName: "bnb",
	rpc: ["https://bsc-dataseed.binance.org"],
	nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
};

describe("Chain metadata - Basic info", () => {
	it("getName returns chain name", () => {
		expect(Chain.getName(mainnet)).toBe("Ethereum Mainnet");
	});

	it("getShortName returns short name", () => {
		expect(Chain.getShortName(mainnet)).toBe("eth");
	});

	it("getSymbol returns native currency symbol", () => {
		expect(Chain.getSymbol(mainnet)).toBe("ETH");
	});
});

describe("Chain metadata - Network info", () => {
	it("getRpcUrl returns RPC URLs", () => {
		const rpc = Chain.getRpcUrl(mainnet);
		expect(rpc).toBeDefined();
		expect(Array.isArray(rpc) || typeof rpc === "string").toBe(true);
	});

	it("getExplorerUrl returns explorer URL", () => {
		const explorer = Chain.getExplorerUrl(mainnet);
		expect(explorer).toBeDefined();
		expect(typeof explorer).toBe("string");
		expect(explorer).toBe("https://etherscan.io");
	});

	it("getExplorerUrl returns undefined for chains without explorers", () => {
		const chain = {
			name: "Test Chain",
			chain: "TEST",
			chainId: 999999,
			shortName: "test",
			rpc: ["https://test.rpc"],
			nativeCurrency: { name: "Test", symbol: "TEST", decimals: 18 },
		};
		expect(Chain.getExplorerUrl(chain)).toBeUndefined();
	});

	it("getWebsocketUrl returns websocket URLs for supported chains", () => {
		const ws = Chain.getWebsocketUrl(mainnet);
		expect(ws).toBeDefined();
		expect(Array.isArray(ws) || typeof ws === "string").toBe(true);
	});

	it("getWebsocketUrl returns undefined for unsupported chains", () => {
		const chain = {
			name: "Test Chain",
			chain: "TEST",
			chainId: 999999,
			shortName: "test",
			rpc: ["https://test.rpc"],
			nativeCurrency: { name: "Test", symbol: "TEST", decimals: 18 },
		};
		expect(Chain.getWebsocketUrl(chain)).toBeUndefined();
	});
});

describe("Chain metadata - Classification", () => {
	it("isTestnet returns false for mainnet", () => {
		expect(Chain.isTestnet(mainnet)).toBe(false);
	});

	it("isTestnet returns true for Sepolia", () => {
		expect(Chain.isTestnet(sepolia)).toBe(true);
	});

	it("isL2 returns false for Ethereum mainnet", () => {
		expect(Chain.isL2(mainnet)).toBe(false);
	});

	it("isL2 returns true for Optimism", () => {
		expect(Chain.isL2(optimism)).toBe(true);
	});

	it("isL2 returns true for Arbitrum", () => {
		expect(Chain.isL2(arbitrum)).toBe(true);
	});

	it("isL2 returns true for Base", () => {
		expect(Chain.isL2(base)).toBe(true);
	});

	it("getL1Chain returns undefined for mainnet", () => {
		expect(Chain.getL1Chain(mainnet)).toBeUndefined();
	});

	it("getL1Chain returns undefined for Optimism (L1 not in metadata)", () => {
		// getL1Chain uses fromId which won't find mainnet in @tevm/chains
		const l1 = Chain.getL1Chain(optimism);
		expect(l1).toBeUndefined(); // Because fromId(1) returns undefined
	});

	it("getL1Chain returns undefined for Arbitrum (L1 not in metadata)", () => {
		const l1 = Chain.getL1Chain(arbitrum);
		expect(l1).toBeUndefined(); // Because fromId(1) returns undefined
	});

	it("getL1Chain returns undefined for Optimism Sepolia (L1 not in metadata)", () => {
		const l1 = Chain.getL1Chain(optimismSepolia);
		expect(l1).toBeUndefined(); // Because fromId(11155111) returns undefined
	});
});

describe("Chain metadata - Hardfork info", () => {
	it("getLatestHardfork returns cancun for mainnet", () => {
		expect(Chain.getLatestHardfork(mainnet)).toBe("cancun");
	});

	it("getHardforkBlock returns correct block for London", () => {
		const londonBlock = Chain.getHardforkBlock(mainnet, "london");
		expect(londonBlock).toBe(12965000);
	});

	it("getHardforkBlock returns correct block for Paris (The Merge)", () => {
		const parisBlock = Chain.getHardforkBlock(mainnet, "paris");
		expect(parisBlock).toBe(15537394);
	});

	it("getHardforkBlock returns correct block for Shanghai", () => {
		const shanghaiBlock = Chain.getHardforkBlock(mainnet, "shanghai");
		expect(shanghaiBlock).toBe(17034870);
	});

	it("getHardforkBlock returns correct block for Cancun", () => {
		const cancunBlock = Chain.getHardforkBlock(mainnet, "cancun");
		expect(cancunBlock).toBe(19426587);
	});

	it("getHardforkBlock returns undefined for unsupported hardfork", () => {
		const pragueBlock = Chain.getHardforkBlock(mainnet, "prague");
		expect(pragueBlock).toBeUndefined();
	});

	it("supportsHardfork returns true for supported hardforks", () => {
		expect(Chain.supportsHardfork(mainnet, "london")).toBe(true);
		expect(Chain.supportsHardfork(mainnet, "paris")).toBe(true);
		expect(Chain.supportsHardfork(mainnet, "shanghai")).toBe(true);
		expect(Chain.supportsHardfork(mainnet, "cancun")).toBe(true);
	});

	it("supportsHardfork returns false for unsupported hardforks", () => {
		expect(Chain.supportsHardfork(mainnet, "prague")).toBe(false);
	});
});

describe("Chain metadata - Constants", () => {
	it("getBlockTime returns 12 seconds for Ethereum", () => {
		expect(Chain.getBlockTime(mainnet)).toBe(12);
	});

	it("getBlockTime returns 2 seconds for Optimism", () => {
		expect(Chain.getBlockTime(optimism)).toBe(2);
	});

	it("getBlockTime returns 0.25 seconds for Arbitrum", () => {
		expect(Chain.getBlockTime(arbitrum)).toBe(0.25);
	});

	it("getBlockTime returns default for unknown chains", () => {
		const chain = {
			name: "Test Chain",
			chain: "TEST",
			chainId: 999999,
			shortName: "test",
			rpc: ["https://test.rpc"],
			nativeCurrency: { name: "Test", symbol: "TEST", decimals: 18 },
		};
		expect(Chain.getBlockTime(chain)).toBe(12);
	});

	it("getGasLimit returns 30M for Ethereum", () => {
		expect(Chain.getGasLimit(mainnet)).toBe(30000000);
	});

	it("getGasLimit returns 32M for Arbitrum", () => {
		expect(Chain.getGasLimit(arbitrum)).toBe(32000000);
	});

	it("getGasLimit returns 80M for zkSync Era", () => {
		expect(Chain.getGasLimit(zkSync)).toBe(80000000);
	});

	it("getGasLimit returns default for unknown chains", () => {
		const chain = {
			name: "Test Chain",
			chain: "TEST",
			chainId: 999999,
			shortName: "test",
			rpc: ["https://test.rpc"],
			nativeCurrency: { name: "Test", symbol: "TEST", decimals: 18 },
		};
		expect(Chain.getGasLimit(chain)).toBe(30000000);
	});
});

describe("Chain metadata - Multiple chains", () => {
	it("handles Polygon metadata", () => {
		const polygon = Chain.fromId(137);
		expect(polygon).toBeDefined();
		expect(Chain.getName(polygon!)).toBe("Polygon Mainnet");
		expect(Chain.getSymbol(polygon!)).toBe("POL");
		expect(Chain.isL2(polygon!)).toBe(false);
		expect(Chain.isTestnet(polygon!)).toBe(false);
		expect(Chain.getBlockTime(polygon!)).toBe(2);
	});

	it("handles Base metadata", () => {
		const base = Chain.fromId(8453);
		expect(base).toBeDefined();
		expect(Chain.isL2(base!)).toBe(true);
		expect(Chain.isTestnet(base!)).toBe(false);
		expect(Chain.getL1Chain(base!)?.chainId).toBe(1);
		expect(Chain.getBlockTime(base!)).toBe(2);
	});

	it("handles Avalanche metadata", () => {
		const avalanche = Chain.fromId(43114);
		expect(avalanche).toBeDefined();
		expect(Chain.isL2(avalanche!)).toBe(false);
		expect(Chain.getBlockTime(avalanche!)).toBe(2);
		expect(Chain.getGasLimit(avalanche!)).toBe(15000000);
	});

	it("handles BSC metadata", () => {
		const bsc = Chain.fromId(56);
		expect(bsc).toBeDefined();
		expect(Chain.getBlockTime(bsc!)).toBe(3);
		expect(Chain.getGasLimit(bsc!)).toBe(140000000);
	});
});
