import { Chain } from "@tevm/voltaire";

// Example: RPC and WebSocket endpoint management

const chains = [
	{ chain: Chain.fromId(1), name: "Ethereum Mainnet" },
	{ chain: Chain.fromId(11155111), name: "Sepolia Testnet" },
	{ chain: Chain.fromId(10), name: "Optimism" },
	{ chain: Chain.fromId(42161), name: "Arbitrum One" },
	{ chain: Chain.fromId(137), name: "Polygon" },
	{ chain: Chain.fromId(8453), name: "Base" },
];
for (const { chain } of chains) {
	if (chain) {
		const c = Chain.from(chain);
		const _rpc = Chain.getRpcUrl(c);
	}
}
for (const { chain } of chains) {
	if (chain) {
		const c = Chain.from(chain);
		const _ws = Chain.getWebsocketUrl(c);
	}
}

// Get mainnet chain
const mainnetChain = Chain.fromId(1);
if (mainnetChain) {
	const eth = Chain.from(mainnetChain);

	// Access all RPC URLs from chain object
	if (eth.rpcUrls.default.http.length > 1) {
		for (let i = 0; i < eth.rpcUrls.default.http.length; i++) {}
	}
	if (eth.rpcUrls.default.webSocket) {
		for (let i = 0; i < eth.rpcUrls.default.webSocket.length; i++) {}
	}

	const customMainnet = {
		...mainnetChain,
		rpcUrls: {
			...mainnetChain.rpcUrls,
			default: {
				http: ["https://custom-rpc.example.com"],
				webSocket: ["wss://custom-ws.example.com"],
			},
		},
	};

	const _customChain = Chain.from(customMainnet);
	const _rpcUrl = Chain.getRpcUrl(eth);
	const wsUrl = Chain.getWebsocketUrl(eth);

	if (wsUrl) {
		// WebSocket available
	}
}

for (const { chain } of chains) {
	if (chain) {
		const c = Chain.from(chain);
		const _hasRpc = Boolean(Chain.getRpcUrl(c));
		const _hasWs = Boolean(Chain.getWebsocketUrl(c));
		const _hasExplorer = Boolean(Chain.getExplorerUrl(c));
		const blockTime = Chain.getBlockTime(c);
		const _maxRequests = Math.floor(60 / blockTime);
	}
}
