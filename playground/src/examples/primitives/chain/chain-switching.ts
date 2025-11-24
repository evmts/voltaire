import * as Chain from "voltaire/primitives/Chain";

// Example: Chain switching and detection patterns

// Available chains for switching (by ID)
const chainIds = [1, 11155111, 10, 42161, 137]; // mainnet, sepolia, optimism, arbitrum, polygon
const availableChains = chainIds.map((id) => Chain.fromId(id)!).filter(Boolean);

console.log("\n=== Available Chains ===");
for (const chain of availableChains) {
	const c = Chain.from(chain);
	const isL2 = Chain.isL2(c);
	const isTest = Chain.isTestnet(c);
	const type = isTest ? "testnet" : "mainnet";
	const layer = isL2 ? "L2" : "L1";

	console.log(
		`[${c.chainId}] ${Chain.getName(c)} (${Chain.getSymbol(c)}) - ${type}, ${layer}`,
	);
}

// Switch chain by ID
function switchChainById(chainId: number) {
	return availableChains.find((c) => c.chainId === chainId);
}

console.log("\n=== Switch Chain by ID ===");
const switchTo10 = switchChainById(10);
if (switchTo10) {
	console.log(`Switched to chain ${switchTo10.chainId}: ${Chain.getName(switchTo10)}`);
	console.log(`RPC: ${Chain.getRpcUrl(switchTo10)}`);
}

const switchTo137 = switchChainById(137);
if (switchTo137) {
	console.log(`Switched to chain ${switchTo137.chainId}: ${Chain.getName(switchTo137)}`);
	console.log(`RPC: ${Chain.getRpcUrl(switchTo137)}`);
}

// Filter chains by network type
console.log("\n=== Mainnet Chains ===");
for (const chain of availableChains) {
	if (!Chain.isTestnet(chain)) {
		console.log(`${Chain.getName(chain)} (${chain.chainId})`);
	}
}

console.log("\n=== Testnet Chains ===");
for (const chain of availableChains) {
	if (Chain.isTestnet(chain)) {
		console.log(`${Chain.getName(chain)} (${chain.chainId})`);
	}
}

console.log("\n=== L2 Chains ===");
for (const chain of availableChains) {
	if (Chain.isL2(chain)) {
		const parent = Chain.getL1Chain(chain);
		const parentName = parent ? Chain.getName(parent) : "unknown";
		console.log(`${Chain.getName(chain)} (${chain.chainId}) - parent: ${parentName}`);
	}
}

// Chain detection by hardfork support
console.log("\n=== Chains Supporting Cancun ===");
for (const chain of availableChains) {
	if (Chain.supportsHardfork(chain, "cancun")) {
		const block = Chain.getHardforkBlock(chain, "cancun");
		console.log(`${Chain.getName(chain)}: block ${block}`);
	}
}

// Chain compatibility check
function areChainCompatible(chain1: ReturnType<typeof Chain.fromId>, chain2: ReturnType<typeof Chain.fromId>): boolean {
	if (!chain1 || !chain2) return false;
	const h1 = Chain.getLatestHardfork(chain1);
	const h2 = Chain.getLatestHardfork(chain2);
	return h1 === h2;
}

console.log("\n=== Chain Compatibility (Hardfork) ===");
const ethChain = Chain.fromId(1)!;
const opChain = Chain.fromId(10)!;
const sepoliaChain = Chain.fromId(11155111)!;

console.log(
	`Mainnet <-> Optimism: ${areChainCompatible(ethChain, opChain)} (both ${Chain.getLatestHardfork(ethChain)})`,
);
console.log(
	`Mainnet <-> Sepolia: ${areChainCompatible(ethChain, sepoliaChain)} (both ${Chain.getLatestHardfork(ethChain)})`,
);

// Find testnet for mainnet
function findTestnet(mainnetChain: ReturnType<typeof Chain.fromId>) {
	if (!mainnetChain || Chain.isTestnet(mainnetChain)) return undefined;

	// For Ethereum mainnet, return Sepolia
	if (mainnetChain.chainId === 1) return Chain.fromId(11155111);

	// For L2s, look for testnet version
	return availableChains.find((chain) => {
		return (
			Chain.isTestnet(chain) &&
			Chain.getName(chain)
				.toLowerCase()
				.includes(Chain.getName(mainnetChain).toLowerCase().split(" ")[0])
		);
	});
}

console.log("\n=== Find Testnet for Mainnet ===");
const mainnetTestnet = findTestnet(ethChain);
if (mainnetTestnet) {
	console.log(
		`Mainnet testnet: ${Chain.getName(mainnetTestnet)} (${mainnetTestnet.chainId})`,
	);
}

const optimismTestnet = findTestnet(opChain);
if (optimismTestnet) {
	console.log(
		`Optimism testnet: ${Chain.getName(optimismTestnet)} (${optimismTestnet.chainId})`,
	);
}
