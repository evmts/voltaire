import * as Chain from "voltaire/primitives/Chain";

// Example: Custom chain configuration

// Define a custom chain
const customChain = {
	chainId: 31337,
	name: "Local Development",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["http://127.0.0.1:8545"],
		},
		public: {
			http: ["http://127.0.0.1:8545"],
		},
	},
	blockExplorers: {
		default: {
			name: "Local Explorer",
			url: "http://localhost:4000",
		},
	},
	testnet: true,
};

const custom = Chain.from(customChain);

console.log("\n=== Custom Chain Configuration ===");
console.log("Chain ID:", custom.chainId);
console.log("Name:", Chain.getName(custom));
console.log("Symbol:", Chain.getSymbol(custom));

console.log("\n=== Network Endpoints ===");
console.log("RPC URL:", Chain.getRpcUrl(custom));
console.log("Explorer URL:", Chain.getExplorerUrl(custom));

console.log("\n=== Classification ===");
console.log("Is testnet:", Chain.isTestnet(custom));
console.log("Is L2:", Chain.isL2(custom));

console.log("\n=== Default Metadata ===");
console.log("Block time:", Chain.getBlockTime(custom), "seconds (default)");
console.log(
	"Gas limit:",
	Chain.getGasLimit(custom).toLocaleString(),
	"(default)",
);
console.log("Latest hardfork:", Chain.getLatestHardfork(custom), "(default)");

// Custom L2 chain
const customL2 = {
	chainId: 99999,
	name: "Custom L2",
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://custom-l2-rpc.example.com"],
			webSocket: ["wss://custom-l2-ws.example.com"],
		},
		public: {
			http: ["https://custom-l2-rpc.example.com"],
			webSocket: ["wss://custom-l2-ws.example.com"],
		},
	},
	blockExplorers: {
		default: {
			name: "Custom L2 Explorer",
			url: "https://explorer.example.com",
		},
	},
	testnet: false,
};

const l2 = Chain.from(customL2);

console.log("\n=== Custom L2 Chain ===");
console.log("Chain ID:", l2.chainId);
console.log("Name:", Chain.getName(l2));
console.log("Symbol:", Chain.getSymbol(l2));

console.log("\n=== Network Endpoints ===");
console.log("RPC URL:", Chain.getRpcUrl(l2));
console.log("WebSocket URL:", Chain.getWebsocketUrl(l2));
console.log("Explorer URL:", Chain.getExplorerUrl(l2));

console.log("\n=== Classification ===");
console.log("Is testnet:", Chain.isTestnet(l2));
console.log("Is L2:", Chain.isL2(l2), "(uses default metadata)");

// Another custom chain with specific short name
const customWithShortName = {
	chainId: 88888,
	name: "Custom Network",
	network: "customnet", // Used as short name
	nativeCurrency: {
		name: "Custom Token",
		symbol: "CTK",
		decimals: 18,
	},
	rpcUrls: {
		default: {
			http: ["https://rpc.customnet.io"],
		},
		public: {
			http: ["https://rpc.customnet.io"],
		},
	},
	blockExplorers: {
		default: {
			name: "CustomScan",
			url: "https://scan.customnet.io",
		},
	},
	testnet: false,
};

const customNet = Chain.from(customWithShortName);

console.log("\n=== Custom Network with Short Name ===");
console.log("Chain ID:", customNet.chainId);
console.log("Name:", Chain.getName(customNet));
console.log("Short name:", Chain.getShortName(customNet));
console.log("Symbol:", Chain.getSymbol(customNet));
console.log("Explorer:", Chain.getExplorerUrl(customNet));
