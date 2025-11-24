import * as Chain from "voltaire/primitives/Chain";

// Example: Block explorer URLs and links

const chains = [
	{ chain: Chain.fromId(1)!, name: "Ethereum Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia Testnet" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum One" },
	{ chain: Chain.fromId(137)!, name: "Polygon" },
	{ chain: Chain.fromId(8453)!, name: "Base" },
];

console.log("\n=== Block Explorer URLs ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const explorer = Chain.getExplorerUrl(c);
	console.log(`${name}:`, explorer);
}

// Generate explorer links for different entities
const exampleAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const exampleTxHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const exampleBlock = "19426587";

console.log("\n=== Address Explorer Links ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(`${name}:`, `${baseUrl}/address/${exampleAddress}`);
	}
}

console.log("\n=== Transaction Explorer Links ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(`${name}:`, `${baseUrl}/tx/${exampleTxHash}`);
	}
}

console.log("\n=== Block Explorer Links ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(`${name}:`, `${baseUrl}/block/${exampleBlock}`);
	}
}

// Helper function to generate explorer links
function generateExplorerLink(
	chain: ReturnType<typeof Chain.from>,
	type: "address" | "tx" | "block" | "token",
	value: string,
): string | undefined {
	const baseUrl = Chain.getExplorerUrl(chain);
	if (!baseUrl) return undefined;

	switch (type) {
		case "address":
			return `${baseUrl}/address/${value}`;
		case "tx":
			return `${baseUrl}/tx/${value}`;
		case "block":
			return `${baseUrl}/block/${value}`;
		case "token":
			return `${baseUrl}/token/${value}`;
	}
}

console.log("\n=== Helper Function Examples ===");
const eth = Chain.from(mainnet);

console.log(
	"Address link:",
	generateExplorerLink(eth, "address", exampleAddress),
);
console.log("Tx link:", generateExplorerLink(eth, "tx", exampleTxHash));
console.log("Block link:", generateExplorerLink(eth, "block", exampleBlock));
console.log(
	"Token link:",
	generateExplorerLink(
		eth,
		"token",
		"0xdac17f958d2ee523a2206206994597c13d831ec7",
	),
);

// Multiple block explorers (some chains have alternatives)
console.log("\n=== Explorer Configuration ===");
const op = Chain.fromId(10)!;
console.log("Optimism default explorer:", Chain.getExplorerUrl(op));

if (op.blockExplorers?.default) {
	console.log("Explorer name:", op.blockExplorers.default.name);
	console.log("Explorer URL:", op.blockExplorers.default.url);
}

// Explorer API endpoints
console.log("\n=== Explorer API Endpoints ===");
const explorerApis = [
	{ chain: Chain.fromId(1)!, name: "Etherscan", apiSuffix: "/api" },
	{ chain: Chain.fromId(10)!, name: "Optimism Explorer", apiSuffix: "/api" },
	{ chain: Chain.fromId(42161)!, name: "Arbiscan", apiSuffix: "/api" },
	{ chain: Chain.fromId(137)!, name: "Polygonscan", apiSuffix: "/api" },
];

for (const { chain, name, apiSuffix } of explorerApis) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(`${name}:`, `${baseUrl}${apiSuffix}`);
	}
}

// Contract verification links
const contractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";

console.log("\n=== Contract Verification Links ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(`${name}:`, `${baseUrl}/address/${contractAddress}#code`);
	}
}

// Token tracker links
console.log("\n=== Token Tracker Links ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
		console.log(
			`${name}:`,
			`${baseUrl}/token/${contractAddress}?a=${exampleAddress}`,
		);
	}
}
