import * as Chain from "voltaire/primitives/Chain";

// Example: Ethereum testnet chains (Sepolia, Holesky)

const sepoliaChain = Chain.fromId(11155111)!; // Sepolia
const holeskyChain = Chain.fromId(17000)!; // Holesky

console.log("\n=== Sepolia Testnet ===");
console.log("Chain ID:", sepoliaChain.chainId);
console.log("Name:", Chain.getName(sepoliaChain));
console.log("Symbol:", Chain.getSymbol(sepoliaChain));
console.log("Is testnet:", Chain.isTestnet(sepoliaChain));
console.log("Is L2:", Chain.isL2(sepoliaChain));

console.log("\nNetwork Info:");
console.log("RPC URL:", Chain.getRpcUrl(sepoliaChain));
console.log("WebSocket URL:", Chain.getWebsocketUrl(sepoliaChain));
console.log("Explorer URL:", Chain.getExplorerUrl(sepoliaChain));

console.log("\nChain Properties:");
console.log("Block time:", Chain.getBlockTime(sepoliaChain), "seconds");
console.log("Gas limit:", Chain.getGasLimit(sepoliaChain).toLocaleString());

console.log("\nHardfork Support:");
console.log("Latest hardfork:", Chain.getLatestHardfork(sepoliaChain));
console.log(
	"London hardfork block:",
	Chain.getHardforkBlock(sepoliaChain, "london"),
);
console.log(
	"Paris hardfork block:",
	Chain.getHardforkBlock(sepoliaChain, "paris"),
);
console.log(
	"Cancun hardfork block:",
	Chain.getHardforkBlock(sepoliaChain, "cancun"),
);

console.log("\n=== Holesky Testnet ===");
console.log("Chain ID:", holeskyChain.chainId);
console.log("Name:", Chain.getName(holeskyChain));
console.log("Symbol:", Chain.getSymbol(holeskyChain));
console.log("Is testnet:", Chain.isTestnet(holeskyChain));

console.log("\nNetwork Info:");
console.log("RPC URL:", Chain.getRpcUrl(holeskyChain));
console.log("WebSocket URL:", Chain.getWebsocketUrl(holeskyChain));
console.log("Explorer URL:", Chain.getExplorerUrl(holeskyChain));

console.log("\nChain Properties:");
console.log("Block time:", Chain.getBlockTime(holeskyChain), "seconds");
console.log("Gas limit:", Chain.getGasLimit(holeskyChain).toLocaleString());

console.log("\nHardfork Support:");
console.log("Latest hardfork:", Chain.getLatestHardfork(holeskyChain));
console.log(
	"Shanghai hardfork block:",
	Chain.getHardforkBlock(holeskyChain, "shanghai"),
);
console.log(
	"Cancun hardfork block:",
	Chain.getHardforkBlock(holeskyChain, "cancun"),
);

console.log("\n=== Testnet Comparison ===");
console.log("Sepolia ID:", sepoliaChain.chainId, "| Holesky ID:", holeskyChain.chainId);
console.log(
	"Sepolia block time:",
	Chain.getBlockTime(sepoliaChain),
	"| Holesky block time:",
	Chain.getBlockTime(holeskyChain),
);
console.log(
	"Sepolia hardfork:",
	Chain.getLatestHardfork(sepoliaChain),
	"| Holesky hardfork:",
	Chain.getLatestHardfork(holeskyChain),
);
