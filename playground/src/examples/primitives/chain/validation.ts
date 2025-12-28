import { Chain } from "voltaire";

// Example: Chain validation and verification

// Validate chain ID
function isValidChainId(chainId: number): boolean {
	return chainId > 0 && Number.isInteger(chainId);
}

// Validate chain configuration
function validateChainConfig(chain: any): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!isValidChainId(chain.chainId)) {
		errors.push("Invalid chain ID");
	}

	if (!chain.name || chain.name.trim().length === 0) {
		errors.push("Missing chain name");
	}

	if (!chain.nativeCurrency) {
		errors.push("Missing native currency");
	} else {
		if (!chain.nativeCurrency.name) {
			errors.push("Missing currency name");
		}
		if (!chain.nativeCurrency.symbol) {
			errors.push("Missing currency symbol");
		}
		if (chain.nativeCurrency.decimals !== 18) {
			errors.push("Non-standard decimals (expected 18)");
		}
	}

	if (
		!chain.rpcUrls ||
		!chain.rpcUrls.default ||
		chain.rpcUrls.default.http.length === 0
	) {
		errors.push("Missing RPC URLs");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
const chains = [
	{ chain: Chain.fromId(1)!, name: "Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
];

for (const { chain, name } of chains) {
	const result = validateChainConfig(chain);
	if (!result.valid) {
		for (const error of result.errors) {
		}
	}
}

// Validate custom chain
const invalidChain = {
	chainId: 0, // Invalid!
	name: "",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: { http: [] }, // No RPC!
		public: { http: [] },
	},
};
const invalidResult = validateChainConfig(invalidChain);
for (const error of invalidResult.errors) {
}

// Check chain uniqueness
function hasDuplicateChainId(chains: any[]): boolean {
	const ids = new Set<number>();
	for (const chain of chains) {
		if (ids.has(chain.chainId)) return true;
		ids.add(chain.chainId);
	}
	return false;
}
const mainnetChain = Chain.fromId(1)!;
const sepoliaChain = Chain.fromId(11155111)!;
const optimismChain = Chain.fromId(10)!;
const uniqueChains = [mainnetChain, sepoliaChain, optimismChain];

const duplicateChains = [mainnetChain, sepoliaChain, mainnetChain];

// Validate RPC endpoint format
function isValidRpcUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function isValidWsUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "ws:" || parsed.protocol === "wss:";
	} catch {
		return false;
	}
}
const rpcUrls = [
	"https://eth.llamarpc.com",
	"http://localhost:8545",
	"invalid-url",
	"ftp://wrong-protocol.com",
];

for (const url of rpcUrls) {
}
const wsUrls = [
	"wss://eth.llamarpc.com",
	"ws://localhost:8545",
	"https://wrong-protocol.com",
	"invalid-ws",
];

for (const url of wsUrls) {
}

// Validate chain accessibility
async function canConnectToChain(
	chain: ReturnType<typeof Chain.from>,
): Promise<boolean> {
	const rpcUrl = Chain.getRpcUrl(chain);
	if (!rpcUrl) return false;
	return true;
}
const eth = Chain.fromId(1)!;
canConnectToChain(eth);

// Validate chain metadata availability
function hasCompleteMetadata(chain: ReturnType<typeof Chain.from>): boolean {
	try {
		const blockTime = Chain.getBlockTime(chain);
		const gasLimit = Chain.getGasLimit(chain);
		const hardfork = Chain.getLatestHardfork(chain);
		const isL2 = Chain.isL2(chain);
		const isTestnet = Chain.isTestnet(chain);

		return (
			blockTime > 0 &&
			gasLimit > 0 &&
			hardfork !== undefined &&
			isL2 !== undefined &&
			isTestnet !== undefined
		);
	} catch {
		return false;
	}
}
const testChains = [
	{ chain: Chain.fromId(1)!, name: "Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum" },
	{ chain: Chain.fromId(137)!, name: "Polygon" },
	{ chain: Chain.fromId(8453)!, name: "Base" },
];

for (const { chain, name } of testChains) {
	const c = Chain.from(chain);
	const complete = hasCompleteMetadata(c);
}

// Safe chain access
function safeGetChainName(chain: any | undefined): string {
	if (!chain) return "unknown";
	try {
		const c = Chain.from(chain);
		return Chain.getName(c);
	} catch {
		return "invalid";
	}
}
