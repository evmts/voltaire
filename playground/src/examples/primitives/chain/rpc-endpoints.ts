import * as Chain from "voltaire/primitives/Chain";

// Example: RPC and WebSocket endpoint management

const chains = [
	{ chain: Chain.fromId(1)!, name: "Ethereum Mainnet" },
	{ chain: Chain.fromId(11155111)!, name: "Sepolia Testnet" },
	{ chain: Chain.fromId(10)!, name: "Optimism" },
	{ chain: Chain.fromId(42161)!, name: "Arbitrum One" },
	{ chain: Chain.fromId(137)!, name: "Polygon" },
	{ chain: Chain.fromId(8453)!, name: "Base" },
];

console.log("\n=== HTTP RPC Endpoints ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const rpc = Chain.getRpcUrl(c);
	console.log(`${name}:`, rpc);
}

console.log("\n=== WebSocket Endpoints ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const ws = Chain.getWebsocketUrl(c);
	if (ws) {
		console.log(`${name}:`, ws);
	} else {
		console.log(`${name}:`, "not configured");
	}
}

// Multiple RPC URLs (fallback pattern)
console.log("\n=== Multiple RPC URLs (from chain config) ===");
const eth = Chain.from(mainnet);
console.log("Default RPC:", Chain.getRpcUrl(eth));

// Access all RPC URLs from chain object
if (eth.rpcUrls.default.http.length > 1) {
	console.log("Fallback RPCs available:", eth.rpcUrls.default.http.length);
	for (let i = 0; i < eth.rpcUrls.default.http.length; i++) {
		console.log(`  [${i}]:`, eth.rpcUrls.default.http[i]);
	}
}

// WebSocket URLs
console.log("\n=== Multiple WebSocket URLs ===");
if (eth.rpcUrls.default.webSocket) {
	console.log(
		"WebSocket URLs available:",
		eth.rpcUrls.default.webSocket.length,
	);
	for (let i = 0; i < eth.rpcUrls.default.webSocket.length; i++) {
		console.log(`  [${i}]:`, eth.rpcUrls.default.webSocket[i]);
	}
}

// Custom RPC endpoint (override)
console.log("\n=== Custom RPC Endpoints ===");
const mainnetChain = Chain.fromId(1)!;
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

const customChain = Chain.from(customMainnet);
console.log("Custom RPC:", Chain.getRpcUrl(customChain));
console.log("Custom WebSocket:", Chain.getWebsocketUrl(customChain));

// Public vs default RPC
console.log("\n=== Public vs Default RPC ===");
const op = Chain.from(optimism);
console.log("Optimism default:", op.rpcUrls.default.http[0]);
console.log("Optimism public:", op.rpcUrls.public.http[0]);

// Check endpoint availability
console.log("\n=== Endpoint Availability Check ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const hasRpc = Boolean(Chain.getRpcUrl(c));
	const hasWs = Boolean(Chain.getWebsocketUrl(c));
	const hasExplorer = Boolean(Chain.getExplorerUrl(c));

	console.log(`${name}:`);
	console.log(`  RPC: ${hasRpc ? "✓" : "✗"}`);
	console.log(`  WebSocket: ${hasWs ? "✓" : "✗"}`);
	console.log(`  Explorer: ${hasExplorer ? "✓" : "✗"}`);
}

// Endpoint construction for specific operations
console.log("\n=== Endpoint Usage Examples ===");
const mainnetChain = Chain.from(mainnet);
const rpcUrl = Chain.getRpcUrl(mainnetChain);
const wsUrl = Chain.getWebsocketUrl(mainnetChain);

console.log("HTTP Request example:");
console.log(`  POST ${rpcUrl}`);
console.log(
	'  Body: {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}',
);

if (wsUrl) {
	console.log("\nWebSocket Connection example:");
	console.log(`  Connect to: ${wsUrl}`);
	console.log(
		'  Subscribe: {"jsonrpc":"2.0","method":"eth_subscribe","params":["newHeads"],"id":1}',
	);
}

// Rate limiting considerations
console.log("\n=== Network Performance ===");
for (const { chain, name } of chains) {
	const c = Chain.from(chain);
	const blockTime = Chain.getBlockTime(c);
	const maxRequests = Math.floor(60 / blockTime); // Rough estimate for polling

	console.log(`${name}:`);
	console.log(`  Block time: ${blockTime}s`);
	console.log(`  Suggested max poll rate: ~${maxRequests} req/min`);
}
