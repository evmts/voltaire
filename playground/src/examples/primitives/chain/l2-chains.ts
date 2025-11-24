import * as Chain from "voltaire/primitives/Chain";

// Example: Layer 2 and sidechain configurations

const opChain = Chain.fromId(10)!; // Optimism
const arbChain = Chain.fromId(42161)!; // Arbitrum One
const baseChain = Chain.fromId(8453)!; // Base
const polyChain = Chain.fromId(137)!; // Polygon

console.log("\n=== Optimism (OP Stack) ===");
console.log("Chain ID:", opChain.chainId);
console.log("Name:", Chain.getName(opChain));
console.log("Symbol:", Chain.getSymbol(opChain));
console.log("Is L2:", Chain.isL2(opChain));
console.log("Is testnet:", Chain.isTestnet(opChain));

const opParent = Chain.getL1Chain(opChain);
console.log("L1 parent chain:", opParent ? Chain.getName(opParent) : "unknown");

console.log("\nNetwork Performance:");
console.log("Block time:", Chain.getBlockTime(opChain), "seconds (fast!)");
console.log("Gas limit:", Chain.getGasLimit(opChain).toLocaleString());

console.log("\nEndpoints:");
console.log("RPC URL:", Chain.getRpcUrl(opChain));
console.log("WebSocket URL:", Chain.getWebsocketUrl(opChain));

console.log("\n=== Arbitrum One ===");
console.log("Chain ID:", arbChain.chainId);
console.log("Name:", Chain.getName(arbChain));
console.log("Symbol:", Chain.getSymbol(arbChain));
console.log("Is L2:", Chain.isL2(arbChain));

const arbParent = Chain.getL1Chain(arbChain);
console.log(
	"L1 parent chain:",
	arbParent ? Chain.getName(arbParent) : "unknown",
);

console.log("\nNetwork Performance:");
console.log(
	"Block time:",
	Chain.getBlockTime(arbChain),
	"seconds (very fast!)",
);
console.log("Gas limit:", Chain.getGasLimit(arbChain).toLocaleString());

console.log("\nEndpoints:");
console.log("RPC URL:", Chain.getRpcUrl(arbChain));
console.log("WebSocket URL:", Chain.getWebsocketUrl(arbChain));

console.log("\n=== Base (Coinbase L2) ===");
console.log("Chain ID:", baseChain.chainId);
console.log("Name:", Chain.getName(baseChain));
console.log("Symbol:", Chain.getSymbol(baseChain));
console.log("Is L2:", Chain.isL2(baseChain));

const baseParent = Chain.getL1Chain(baseChain);
console.log(
	"L1 parent chain:",
	baseParent ? Chain.getName(baseParent) : "unknown",
);

console.log("\nNetwork Performance:");
console.log("Block time:", Chain.getBlockTime(baseChain), "seconds");
console.log("Gas limit:", Chain.getGasLimit(baseChain).toLocaleString());

console.log("\n=== Polygon (Sidechain) ===");
console.log("Chain ID:", polyChain.chainId);
console.log("Name:", Chain.getName(polyChain));
console.log("Symbol:", Chain.getSymbol(polyChain));
console.log("Is L2:", Chain.isL2(polyChain), "(sidechain, not true L2)");
console.log("Is testnet:", Chain.isTestnet(polyChain));

console.log("\nNetwork Performance:");
console.log("Block time:", Chain.getBlockTime(polyChain), "seconds");
console.log("Gas limit:", Chain.getGasLimit(polyChain).toLocaleString());

console.log("\n=== L2 Comparison ===");
const chains = [
	{ chain: opChain, name: "Optimism" },
	{ chain: arbChain, name: "Arbitrum" },
	{ chain: baseChain, name: "Base" },
	{ chain: polyChain, name: "Polygon" },
];

console.log("\nBlock Times:");
for (const { chain, name } of chains) {
	console.log(`${name}: ${Chain.getBlockTime(chain)}s`);
}

console.log("\nGas Limits:");
for (const { chain, name } of chains) {
	console.log(`${name}: ${Chain.getGasLimit(chain).toLocaleString()}`);
}

console.log("\nL2 Status:");
for (const { chain, name } of chains) {
	const isL2 = Chain.isL2(chain);
	const parent = isL2 ? Chain.getL1Chain(chain) : null;
	const parentName = parent ? Chain.getName(parent) : "none";
	console.log(`${name}: ${isL2 ? "L2" : "sidechain"} (parent: ${parentName})`);
}
