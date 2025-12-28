import { Chain } from "@tevm/voltaire";

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
