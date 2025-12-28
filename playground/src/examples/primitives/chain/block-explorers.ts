import { Chain } from "voltaire";

// Example: Block explorer URLs and links

const chains = [
	{ chain: Chain.fromId(1)!, name: "Ethereum Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia Testnet" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum One" },
	{ chain: Chain.fromId(137)!, name: "Polygon" },
	{ chain: Chain.fromId(8453)!, name: "Base" },
];
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const explorer = Chain.getExplorerUrl(c);
}

// Generate explorer links for different entities
const exampleAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
const exampleTxHash =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const exampleBlock = "19426587";
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
	}
}
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
	}
}
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
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
const eth = Chain.from(mainnet);
const op = Chain.fromId(10)!;

if (op.blockExplorers?.default) {
}
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
	}
}

// Contract verification links
const contractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
	}
}
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const baseUrl = Chain.getExplorerUrl(c);
	if (baseUrl) {
	}
}
