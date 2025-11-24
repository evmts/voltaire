import * as Chain from "voltaire/primitives/Chain";

// Example: Chain basics - configuration, properties, and utilities

// Create chain instances by ID
const eth = Chain.fromId(1)!; // Ethereum Mainnet
const test = Chain.fromId(11155111)!; // Sepolia
const l2 = Chain.fromId(10)!; // Optimism
const sidechain = Chain.fromId(137)!; // Polygon

console.log("\n=== Chain Properties ===");
console.log("Mainnet name:", Chain.getName(eth));
console.log("Mainnet short name:", Chain.getShortName(eth));
console.log("Mainnet symbol:", Chain.getSymbol(eth));
console.log("Mainnet ID:", eth.chainId);

console.log("\nSepolia name:", Chain.getName(test));
console.log("Sepolia ID:", test.chainId);

console.log("\n=== Network Classification ===");
console.log("Mainnet is testnet:", Chain.isTestnet(eth));
console.log("Sepolia is testnet:", Chain.isTestnet(test));
console.log("Mainnet is L2:", Chain.isL2(eth));
console.log("Optimism is L2:", Chain.isL2(l2));
console.log("Polygon is L2:", Chain.isL2(sidechain));

// L2 parent chain
if (Chain.isL2(l2)) {
	const parent = Chain.getL1Chain(l2);
	console.log(
		"\nOptimism L1 chain:",
		parent ? Chain.getName(parent) : "unknown",
	);
}

console.log("\n=== Network Endpoints ===");
const mainnetRpc = Chain.getRpcUrl(eth);
console.log("Mainnet RPC:", mainnetRpc);

const mainnetWs = Chain.getWebsocketUrl(eth);
console.log("Mainnet WebSocket:", mainnetWs);

const explorer = Chain.getExplorerUrl(eth);
console.log("Mainnet Explorer:", explorer);

console.log("\n=== Chain Constants ===");
console.log("Mainnet block time:", Chain.getBlockTime(eth), "seconds");
console.log("Mainnet gas limit:", Chain.getGasLimit(eth));
console.log("Optimism block time:", Chain.getBlockTime(l2), "seconds");
console.log("Optimism gas limit:", Chain.getGasLimit(l2));

console.log("\n=== Hardfork Info ===");
const latestHardfork = Chain.getLatestHardfork(eth);
console.log("Latest hardfork:", latestHardfork);

const londonBlock = Chain.getHardforkBlock(eth, "london");
console.log("London hardfork block:", londonBlock);

const cancunBlock = Chain.getHardforkBlock(eth, "cancun");
console.log("Cancun hardfork block:", cancunBlock);

console.log("\n=== Hardfork Support ===");
console.log("Supports London:", Chain.supportsHardfork(eth, "london"));
console.log("Supports Cancun:", Chain.supportsHardfork(eth, "cancun"));
console.log("Supports Prague:", Chain.supportsHardfork(eth, "prague"));

console.log("\n=== Chain Lookup ===");
// Access chain data by ID without creating instance
const chainData = Chain.byId[1];
console.log("Chain 1:", chainData?.name);
console.log("Chain 10:", Chain.byId[10]?.name);
console.log("Chain 137:", Chain.byId[137]?.name);
