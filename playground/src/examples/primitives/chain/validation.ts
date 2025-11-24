import * as Chain from "voltaire/primitives/Chain";

// Example: Chain validation and verification

// Validate chain ID
function isValidChainId(chainId: number): boolean {
	return chainId > 0 && Number.isInteger(chainId);
}

console.log("\n=== Chain ID Validation ===");
console.log("Valid chain ID (1):", isValidChainId(1));
console.log("Valid chain ID (31337):", isValidChainId(31337));
console.log("Invalid chain ID (0):", isValidChainId(0));
console.log("Invalid chain ID (-1):", isValidChainId(-1));
console.log("Invalid chain ID (1.5):", isValidChainId(1.5));

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

console.log("\n=== Chain Configuration Validation ===");
const chains = [
	{ chain: Chain.fromId(1)!, name: "Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
];

for (const { chain, name } of chains) {
	const result = validateChainConfig(chain);
	console.log(`${name}: ${result.valid ? "✓ Valid" : "✗ Invalid"}`);
	if (!result.valid) {
		for (const error of result.errors) {
			console.log(`  - ${error}`);
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

console.log("\n=== Invalid Chain Example ===");
const invalidResult = validateChainConfig(invalidChain);
console.log("Valid:", invalidResult.valid);
console.log("Errors:");
for (const error of invalidResult.errors) {
	console.log(`  - ${error}`);
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

console.log("\n=== Chain ID Uniqueness ===");
const mainnetChain = Chain.fromId(1)!;
const sepoliaChain = Chain.fromId(11155111)!;
const optimismChain = Chain.fromId(10)!;
const uniqueChains = [mainnetChain, sepoliaChain, optimismChain];
console.log("Unique chains:", !hasDuplicateChainId(uniqueChains));

const duplicateChains = [mainnetChain, sepoliaChain, mainnetChain];
console.log("Duplicate chains:", hasDuplicateChainId(duplicateChains));

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

console.log("\n=== RPC URL Validation ===");
const rpcUrls = [
	"https://eth.llamarpc.com",
	"http://localhost:8545",
	"invalid-url",
	"ftp://wrong-protocol.com",
];

for (const url of rpcUrls) {
	console.log(`${url}: ${isValidRpcUrl(url) ? "✓" : "✗"}`);
}

console.log("\n=== WebSocket URL Validation ===");
const wsUrls = [
	"wss://eth.llamarpc.com",
	"ws://localhost:8545",
	"https://wrong-protocol.com",
	"invalid-ws",
];

for (const url of wsUrls) {
	console.log(`${url}: ${isValidWsUrl(url) ? "✓" : "✗"}`);
}

// Validate chain accessibility
async function canConnectToChain(
	chain: ReturnType<typeof Chain.from>,
): Promise<boolean> {
	const rpcUrl = Chain.getRpcUrl(chain);
	if (!rpcUrl) return false;

	// This is a mock - in real code you'd make an actual RPC call
	console.log(`Would check connection to: ${rpcUrl}`);
	return true;
}

console.log("\n=== Chain Accessibility Check (mock) ===");
const eth = Chain.fromId(1)!;
console.log(`Checking ${Chain.getName(eth)}...`);
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

console.log("\n=== Metadata Completeness ===");
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
	console.log(`${name}: ${complete ? "✓ Complete" : "✗ Incomplete"}`);
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

console.log("\n=== Safe Chain Access ===");
console.log("Valid chain:", safeGetChainName(mainnetChain));
console.log("Undefined chain:", safeGetChainName(undefined));
