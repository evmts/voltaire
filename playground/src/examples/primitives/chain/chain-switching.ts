import { Chain } from "@tevm/voltaire";

// Example: Chain switching and detection patterns

// Available chains for switching (by ID)
const chainIds = [1, 11155111, 10, 42161, 137]; // mainnet, sepolia, optimism, arbitrum, polygon
const availableChains = chainIds
	.map((id) => Chain.fromId(id))
	.filter((c): c is NonNullable<typeof c> => c !== undefined);
for (const chain of availableChains) {
	const c = Chain.from(chain);
	const isL2 = Chain.isL2(c);
	const isTest = Chain.isTestnet(c);
	const type = isTest ? "testnet" : "mainnet";
	const layer = isL2 ? "L2" : "L1";
}

// Switch chain by ID
function switchChainById(chainId: number) {
	return availableChains.find((c) => c.chainId === chainId);
}
const switchTo10 = switchChainById(10);
if (switchTo10) {
}

const switchTo137 = switchChainById(137);
if (switchTo137) {
}
for (const chain of availableChains) {
	if (!Chain.isTestnet(chain)) {
	}
}
for (const chain of availableChains) {
	if (Chain.isTestnet(chain)) {
	}
}
for (const chain of availableChains) {
	if (Chain.isL2(chain)) {
		const parent = Chain.getL1Chain(chain);
		const parentName = parent ? Chain.getName(parent) : "unknown";
	}
}
for (const chain of availableChains) {
	if (Chain.supportsHardfork(chain, "cancun")) {
		const block = Chain.getHardforkBlock(chain, "cancun");
	}
}

// Chain compatibility check
function areChainCompatible(
	chain1: ReturnType<typeof Chain.fromId>,
	chain2: ReturnType<typeof Chain.fromId>,
): boolean {
	if (!chain1 || !chain2) return false;
	const h1 = Chain.getLatestHardfork(chain1);
	const h2 = Chain.getLatestHardfork(chain2);
	return h1 === h2;
}
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const ethChain = Chain.fromId(1)!;
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const opChain = Chain.fromId(10)!;
// biome-ignore lint/style/noNonNullAssertion: example code with known valid IDs
const sepoliaChain = Chain.fromId(11155111)!;

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
const mainnetTestnet = findTestnet(ethChain);
if (mainnetTestnet) {
}

const optimismTestnet = findTestnet(opChain);
if (optimismTestnet) {
}
